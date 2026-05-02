import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";

import type { Database } from "..";
import {
  invitation,
  member,
  organization,
  user,
  type Invitation,
  type OrganizationRole,
} from "../schema/auth";

export type ResolvedOrganizationInvitationStatus = "pending" | "accepted" | "rejected" | "expired";

export type OrganizationInvitationFilterStatus = Exclude<
  ResolvedOrganizationInvitationStatus,
  "pending"
>;

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

export type OrganizationInvitationRow = {
  id: string;
  email: string;
  inviteeName: string | null;
  role: OrganizationRole | null;
  status: ResolvedOrganizationInvitationStatus;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
  expiresAt: Date;
  createdAt: Date;
};

export type ListOrganizationInvitationsFilter = {
  limit: number;
  offset: number;
  organizationId?: string;
  roles?: OrganizationRole[];
  statuses?: OrganizationInvitationFilterStatus[];
  search?: string;
  sentFrom?: Date;
  sentTo?: Date;
  sortBy: "email" | "createdAt" | "organizationName";
  sortDirection: "asc" | "desc";
};

export type ListOrganizationInvitationsResult = {
  rows: OrganizationInvitationRow[];
  totalCount: number;
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

export async function listOrganizationInvitations(
  database: Database,
  input: ListOrganizationInvitationsFilter,
): Promise<ListOrganizationInvitationsResult> {
  const {
    limit,
    offset,
    organizationId,
    roles,
    search,
    sentFrom,
    sentTo,
    sortBy,
    sortDirection,
    statuses,
  } = input;
  const now = new Date();
  const filters: SQL[] = [];

  if (organizationId) {
    filters.push(eq(invitation.organizationId, organizationId));
  }

  if (roles && roles.length > 0) {
    filters.push(inArray(invitation.role, roles));
  }

  if (statuses && statuses.length > 0) {
    const statusFilters = statuses.flatMap<SQL>((status) => {
      if (status === "expired") {
        const expiredFilter = and(eq(invitation.status, "pending"), lte(invitation.expiresAt, now));

        return expiredFilter ? [expiredFilter] : [];
      }

      return [eq(invitation.status, status)];
    });
    const combinedStatuses = or(...statusFilters);

    if (combinedStatuses) {
      filters.push(combinedStatuses);
    }
  }

  if (search) {
    const pattern = `%${search}%`;
    const combinedSearch = or(
      ilike(invitation.email, pattern),
      ilike(invitation.inviteeName, pattern),
      ilike(organization.name, pattern),
    );

    if (combinedSearch) {
      filters.push(combinedSearch);
    }
  }

  if (sentFrom) {
    filters.push(gte(invitation.createdAt, sentFrom));
  }

  if (sentTo) {
    filters.push(lte(invitation.createdAt, sentTo));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = {
    email: invitation.email,
    createdAt: invitation.createdAt,
    organizationName: organization.name,
  }[sortBy];
  const orderBy = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        invitation,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        inviterName: user.name,
        inviterEmail: user.email,
      })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    database
      .select({ value: count() })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.invitation.id,
      email: row.invitation.email,
      inviteeName: row.invitation.inviteeName,
      role: row.invitation.role,
      status: resolveInvitationStatus(row.invitation),
      organizationId: row.invitation.organizationId,
      organizationName: row.organizationName,
      organizationSlug: row.organizationSlug,
      inviterId: row.invitation.inviterId,
      inviterName: row.inviterName,
      inviterEmail: row.inviterEmail,
      expiresAt: row.invitation.expiresAt,
      createdAt: row.invitation.createdAt,
    })),
    totalCount: totalRow[0]?.value ?? 0,
  };
}
