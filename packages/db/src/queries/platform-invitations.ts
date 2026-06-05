import { and, asc, count, desc, eq, gt, gte, ilike, lte, or, type SQL } from "drizzle-orm";

import type { Database } from "..";
import {
  platform_invitation,
  platformInvitationStatusEnum,
  user,
  type PlatformInvitation,
  type PlatformInvitationStatus,
  type UserRole,
} from "../schema/auth";

export type ResolvedPlatformInvitationStatus = PlatformInvitationStatus | "expired";

export type PlatformInvitationRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: ResolvedPlatformInvitationStatus;
  inviterName: string;
  inviterUserId: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlatformInvitationFilterStatus = Exclude<ResolvedPlatformInvitationStatus, "pending">;

export type ListPlatformInvitationsFilter = {
  limit: number;
  offset: number;
  statuses?: PlatformInvitationFilterStatus[];
  sentFrom?: Date;
  sentTo?: Date;
  sortBy: "name" | "email" | "createdAt";
  sortDirection: "asc" | "desc";
};

export type ListPlatformInvitationsResult = {
  rows: PlatformInvitationRow[];
  totalCount: number;
};

function resolveInvitationStatus(
  invitation: Pick<PlatformInvitation, "status" | "expiresAt">,
): ResolvedPlatformInvitationStatus {
  if (invitation.status === "pending" && invitation.expiresAt <= new Date()) {
    return "expired";
  }

  return invitation.status;
}

function mapInvitation(invitation: PlatformInvitation): PlatformInvitationRow {
  return {
    id: invitation.id,
    email: invitation.email,
    name: invitation.name,
    role: invitation.role,
    status: resolveInvitationStatus(invitation),
    inviterName: invitation.inviterName,
    inviterUserId: invitation.inviterUserId,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    rejectedAt: invitation.rejectedAt,
    revokedAt: invitation.revokedAt,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
}

export async function getPlatformInvitationById(
  database: Database,
  input: { invitationId: string },
): Promise<PlatformInvitationRow | null> {
  const row = await database.query.platform_invitation.findFirst({
    where: eq(platform_invitation.id, input.invitationId),
  });

  return row ? mapInvitation(row) : null;
}

export async function getPlatformInvitationByTokenHash(
  database: Database,
  input: { tokenHash: string },
): Promise<PlatformInvitationRow | null> {
  const row = await database.query.platform_invitation.findFirst({
    where: eq(platform_invitation.tokenHash, input.tokenHash),
  });

  return row ? mapInvitation(row) : null;
}

export async function getActivePlatformInvitationByEmail(
  database: Database,
  input: { email: string },
): Promise<PlatformInvitationRow | null> {
  const row = await database.query.platform_invitation.findFirst({
    where: and(
      ilike(platform_invitation.email, input.email),
      eq(platform_invitation.status, platformInvitationStatusEnum.enumValues[0]),
      gt(platform_invitation.expiresAt, new Date()),
    ),
    orderBy: [desc(platform_invitation.createdAt)],
  });

  return row ? mapInvitation(row) : null;
}

export async function listPlatformInvitations(
  database: Database,
  input: ListPlatformInvitationsFilter,
): Promise<ListPlatformInvitationsResult> {
  const { limit, offset, sentFrom, sentTo, sortBy, sortDirection, statuses } = input;
  const now = new Date();
  const filters: SQL[] = [];

  if (statuses && statuses.length > 0) {
    const statusFilters = statuses.flatMap<SQL>((status) => {
      if (status === "expired") {
        const expiredFilter = and(
          eq(platform_invitation.status, "pending"),
          lte(platform_invitation.expiresAt, now),
        );

        return expiredFilter ? [expiredFilter] : [];
      }

      return [eq(platform_invitation.status, status)];
    });
    const combinedStatuses = or(...statusFilters);

    if (combinedStatuses) {
      filters.push(combinedStatuses);
    }
  }

  if (sentFrom) {
    filters.push(gte(platform_invitation.createdAt, sentFrom));
  }

  if (sentTo) {
    filters.push(lte(platform_invitation.createdAt, sentTo));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = {
    name: platform_invitation.name,
    email: platform_invitation.email,
    createdAt: platform_invitation.createdAt,
  }[sortBy];
  const orderBy = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [rows, totalRow] = await Promise.all([
    database.query.platform_invitation.findMany({
      where,
      orderBy: [orderBy],
      limit,
      offset,
    }),
    database.select({ value: count() }).from(platform_invitation).where(where),
  ]);

  return {
    rows: rows.map(mapInvitation),
    totalCount: totalRow[0]?.value ?? 0,
  };
}

export async function createPlatformInvitation(
  database: Database,
  input: {
    email: string;
    name: string;
    role: UserRole;
    tokenHash: string;
    inviterName: string;
    inviterUserId: string;
    expiresAt: Date;
  },
): Promise<PlatformInvitationRow> {
  const [row] = await database
    .insert(platform_invitation)
    .values({
      email: input.email,
      name: input.name,
      role: input.role,
      tokenHash: input.tokenHash,
      inviterName: input.inviterName,
      inviterUserId: input.inviterUserId,
      expiresAt: input.expiresAt,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create platform invitation");
  }

  return mapInvitation(row);
}

export async function refreshPlatformInvitation(
  database: Database,
  input: {
    invitationId: string;
    tokenHash: string;
    expiresAt: Date;
  },
): Promise<PlatformInvitationRow | null> {
  const [row] = await database
    .update(platform_invitation)
    .set({
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      status: "pending",
      acceptedAt: null,
      rejectedAt: null,
      revokedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(platform_invitation.id, input.invitationId))
    .returning();

  return row ? mapInvitation(row) : null;
}

export async function markPlatformInvitationAccepted(
  database: Database,
  input: {
    invitationId: string;
    acceptedUserId: string;
  },
): Promise<PlatformInvitationRow | null> {
  const [row] = await database
    .update(platform_invitation)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
      acceptedUserId: input.acceptedUserId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(platform_invitation.id, input.invitationId),
        eq(platform_invitation.status, "pending"),
      ),
    )
    .returning();

  return row ? mapInvitation(row) : null;
}

export async function markPlatformInvitationRejected(
  database: Database,
  input: { invitationId: string },
): Promise<PlatformInvitationRow | null> {
  const [row] = await database
    .update(platform_invitation)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(platform_invitation.id, input.invitationId),
        eq(platform_invitation.status, "pending"),
      ),
    )
    .returning();

  return row ? mapInvitation(row) : null;
}

export async function markPlatformInvitationRevoked(
  database: Database,
  input: { invitationId: string },
): Promise<PlatformInvitationRow | null> {
  const [row] = await database
    .update(platform_invitation)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(platform_invitation.id, input.invitationId),
        eq(platform_invitation.status, "pending"),
      ),
    )
    .returning();

  return row ? mapInvitation(row) : null;
}

export async function getPlatformUserByEmail(
  database: Database,
  input: { email: string },
): Promise<{ id: string; email: string } | null> {
  const row = await database.query.user.findFirst({
    columns: {
      id: true,
      email: true,
    },
    where: ilike(user.email, input.email),
  });

  return row ?? null;
}
