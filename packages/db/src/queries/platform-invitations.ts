import { and, desc, eq, gt, ilike } from "drizzle-orm";

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
): Promise<PlatformInvitationRow[]> {
  const rows = await database.query.platform_invitation.findMany({
    orderBy: [desc(platform_invitation.createdAt)],
  });

  return rows.map(mapInvitation);
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
    .where(eq(platform_invitation.id, input.invitationId))
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
    .where(eq(platform_invitation.id, input.invitationId))
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
    .where(eq(platform_invitation.id, input.invitationId))
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
