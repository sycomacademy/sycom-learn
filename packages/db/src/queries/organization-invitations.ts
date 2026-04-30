import { and, eq } from "drizzle-orm";

import type { Database } from "..";
import { invitation, member, organization, user, type Invitation } from "../schema/auth";

export type ResolvedOrganizationInvitationStatus = "pending" | "accepted" | "rejected" | "expired";

export type OrganizationInvitationInviteeRow = {
  id: string;
  email: string;
  inviteeName: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  status: ResolvedOrganizationInvitationStatus;
  expiresAt: Date;
  role: Invitation["role"];
  inviterName: string | null;
};

function resolveInvitationStatus(
  row: Pick<Invitation, "status" | "expiresAt">,
): ResolvedOrganizationInvitationStatus {
  if (row.status === "accepted" || row.status === "rejected") {
    return row.status;
  }

  const now = Date.now();
  const exp = row.expiresAt?.getTime() ?? Infinity;
  if (row.status === "pending" && exp <= now) {
    return "expired";
  }

  return "pending";
}

export async function getOrganizationInvitationByTokenHash(
  database: Database,
  input: { tokenHash: string },
): Promise<OrganizationInvitationInviteeRow | null> {
  const rows = await database
    .select({
      invitation,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(eq(invitation.tokenHash, input.tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.invitation.id,
    email: row.invitation.email,
    inviteeName: row.invitation.inviteeName,
    organizationId: row.invitation.organizationId,
    organizationName: row.organizationName,
    organizationSlug: row.organizationSlug,
    status: resolveInvitationStatus(row.invitation),
    expiresAt: row.invitation.expiresAt,
    role: row.invitation.role,
    inviterName: row.inviterName,
  };
}

export async function markOrganizationInvitationAccepted(
  database: Database,
  input: { invitationId: string },
): Promise<boolean> {
  const result = await database
    .update(invitation)
    .set({ status: "accepted" })
    .where(and(eq(invitation.id, input.invitationId), eq(invitation.status, "pending")))
    .returning({ id: invitation.id });

  return result.length > 0;
}

export async function markOrganizationInvitationRejected(
  database: Database,
  input: { invitationId: string },
): Promise<boolean> {
  const result = await database
    .update(invitation)
    .set({ status: "rejected" })
    .where(and(eq(invitation.id, input.invitationId), eq(invitation.status, "pending")))
    .returning({ id: invitation.id });

  return result.length > 0;
}

export async function insertOrganizationOwnerMember(
  database: Database,
  input: { organizationId: string; userId: string },
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const [row] = await database
    .insert(member)
    .values({
      id,
      organizationId: input.organizationId,
      userId: input.userId,
      role: "owner",
    })
    .returning({ id: member.id });

  if (!row) {
    throw new Error("Failed to insert organization owner member");
  }

  return row;
}
