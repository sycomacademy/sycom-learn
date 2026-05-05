import type { QueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";

const STORAGE_KEY = "sycom_pending_owner_invite_org";

export type PendingOwnerInviteOrgStored = {
  organizationId: string;
  organizationSlug: string;
};

export function storePendingOwnerInviteOrganization(data: PendingOwnerInviteOrgStored): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function readPendingFromStorage(): PendingOwnerInviteOrgStored | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "organizationId" in parsed &&
      "organizationSlug" in parsed &&
      typeof (parsed as PendingOwnerInviteOrgStored).organizationId === "string" &&
      typeof (parsed as PendingOwnerInviteOrgStored).organizationSlug === "string"
    ) {
      return parsed as PendingOwnerInviteOrgStored;
    }
    clearPendingFromStorage();
    return null;
  } catch {
    clearPendingFromStorage();
    return null;
  }
}

function clearPendingFromStorage() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Applies a pending org-owner invite “set active organization” preference after email accept.
 * Unauthenticated accepts cannot call Better Auth; we stash IDs in sessionStorage and run this
 * once a session exists (see `resolveAuthenticatedEntryHref`).
 */
export async function applyPendingOwnerInviteActiveOrganization(queryClient: QueryClient) {
  const pending = readPendingFromStorage();
  if (!pending) return;

  const { error } = await authClient.organization.setActive({
    organizationId: pending.organizationId,
    organizationSlug: pending.organizationSlug,
  });

  if (error) {
    return;
  }

  clearPendingFromStorage();
  await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}
