import { and, asc, eq } from "drizzle-orm";

import type { Database } from "..";
import { member, organization, user, type OrganizationRole } from "../schema/auth";

export type OrganizationMembershipRow = {
  organizationId: string;
  name: string;
  slug: string;
};

export async function listOrganizationMembershipsForUser(
  database: Database,
  input: { userId: string },
): Promise<OrganizationMembershipRow[]> {
  return database
    .select({
      organizationId: member.organizationId,
      name: organization.name,
      slug: organization.slug,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, input.userId))
    .orderBy(asc(organization.name));
}

function parseOrganizationMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try {
    const parsed: unknown = JSON.parse(metadata);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** Primary owner email for learner-facing contact (first owner row if multiple). */
export async function getOrganizationOwnerEmail(
  database: Database,
  organizationId: string,
): Promise<string | null> {
  const [row] = await database
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, organizationId), eq(member.role, "owner")))
    .limit(1);

  return row?.email ?? null;
}

export async function getOrganizationOnboardingSnapshot(
  database: Database,
  input: { organizationId: string },
): Promise<{ onboardedAt: Date | null } | null> {
  const [row] = await database
    .select({ onboardedAt: organization.onboardedAt })
    .from(organization)
    .where(eq(organization.id, input.organizationId))
    .limit(1);

  return row ?? null;
}

export async function getMemberRole(
  database: Database,
  input: { organizationId: string; userId: string },
): Promise<OrganizationRole | null> {
  const [row] = await database
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, input.organizationId), eq(member.userId, input.userId)))
    .limit(1);

  return row?.role ?? null;
}

export async function setOrganizationOnboardedAt(
  database: Database,
  input: { organizationId: string; at: Date },
): Promise<{ onboardedAt: Date | null } | null> {
  const [row] = await database
    .update(organization)
    .set({ onboardedAt: input.at })
    .where(eq(organization.id, input.organizationId))
    .returning({ onboardedAt: organization.onboardedAt });

  return row ?? null;
}

/** Name/slug/logo for owner onboarding confirmation (trusted DB read). */
export async function getOrganizationOnboardingContext(
  database: Database,
  input: { organizationId: string },
): Promise<{ name: string; slug: string; logoPublicId: string | null } | null> {
  const row = await database.query.organization.findFirst({
    columns: { name: true, slug: true, logo: true },
    where: eq(organization.id, input.organizationId),
  });
  return row ? { name: row.name, slug: row.slug, logoPublicId: row.logo } : null;
}

export type OrganizationWorkspaceContextRow = {
  organizationId: string;
  name: string;
  slug: string;
  logoPublicId: string | null;
  accentHexRaw: string | undefined;
  memberRole: OrganizationRole;
};

/** Active org branding + caller's membership role for org workspace chrome. */
export async function getOrganizationWorkspaceContextForMember(
  database: Database,
  input: { organizationId: string; userId: string },
): Promise<OrganizationWorkspaceContextRow | null> {
  const rows = await database
    .select({
      organizationId: organization.id,
      name: organization.name,
      slug: organization.slug,
      logoPublicId: organization.logo,
      metadata: organization.metadata,
      memberRole: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.organizationId, input.organizationId), eq(member.userId, input.userId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const meta = parseOrganizationMetadata(row.metadata);
  const raw = meta.accentHex;
  const accentHexRaw =
    typeof raw === "string" && /^#[0-9A-Fa-f]{6}$/.test(raw.trim()) ? raw.trim() : undefined;

  return {
    organizationId: row.organizationId,
    name: row.name,
    slug: row.slug,
    logoPublicId: row.logoPublicId,
    accentHexRaw,
    memberRole: row.memberRole,
  };
}

export async function finalizeOrganizationOnboarding(
  database: Database,
  input: {
    organizationId: string;
    at: Date;
    logoPublicId?: string;
    accentHex: string;
  },
): Promise<void> {
  const row = await database.query.organization.findFirst({
    columns: { metadata: true },
    where: eq(organization.id, input.organizationId),
  });
  if (!row) {
    return;
  }

  const meta = parseOrganizationMetadata(row.metadata);
  meta.accentHex = input.accentHex;

  const setPayload: {
    onboardedAt: Date;
    metadata: string;
    logo?: string | null;
  } = {
    onboardedAt: input.at,
    metadata: JSON.stringify(meta),
  };

  if (input.logoPublicId !== undefined) {
    setPayload.logo = input.logoPublicId;
  }

  await database
    .update(organization)
    .set(setPayload)
    .where(eq(organization.id, input.organizationId));
}

/** Owner-only org branding updates after onboarding (logo column + metadata.accentHex). */
export async function updateOrganizationBranding(
  database: Database,
  input: {
    organizationId: string;
    accentHex?: string;
    logoPublicId?: string;
  },
): Promise<boolean> {
  const row = await database.query.organization.findFirst({
    columns: { metadata: true },
    where: eq(organization.id, input.organizationId),
  });
  if (!row) return false;

  const meta = parseOrganizationMetadata(row.metadata);
  if (input.accentHex !== undefined) {
    meta.accentHex = input.accentHex;
  }

  const setPayload: { metadata: string; logo?: string | null } = {
    metadata: JSON.stringify(meta),
  };
  if (input.logoPublicId !== undefined) {
    setPayload.logo = input.logoPublicId;
  }

  await database
    .update(organization)
    .set(setPayload)
    .where(eq(organization.id, input.organizationId));
  return true;
}
