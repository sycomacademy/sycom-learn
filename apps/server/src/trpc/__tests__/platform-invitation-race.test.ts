import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { inArray } from "drizzle-orm";
import { platform_invitation, user } from "@sycom/db/schema/auth";
import {
  createPlatformInvitation,
  markPlatformInvitationAccepted,
  markPlatformInvitationRevoked,
} from "@sycom/db/queries/platform-invitations";

import { dbEnabled, testDb, testUser } from "./helpers";

function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

describe.skipIf(!dbEnabled)("platform invitation race guards", () => {
  const createdUserIds: string[] = [];
  const createdInvitationIds: string[] = [];

  afterEach(async () => {
    if (createdInvitationIds.length) {
      await testDb
        .delete(platform_invitation)
        .where(inArray(platform_invitation.id, createdInvitationIds));
      createdInvitationIds.length = 0;
    }
    if (createdUserIds.length) {
      await testDb.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds.length = 0;
    }
  });

  test("accept fails when invitation was revoked first", async () => {
    const inviter = testUser();
    createdUserIds.push(inviter.id);
    await testDb.insert(user).values({
      id: inviter.id,
      email: inviter.email,
      name: inviter.name,
      emailVerified: true,
    });

    const invitation = await createPlatformInvitation(testDb, {
      email: `${crypto.randomUUID()}@invite.test`,
      name: "Invited User",
      role: "content_creator",
      tokenHash: hashInvitationToken("race-test-token"),
      inviterName: inviter.name,
      inviterUserId: inviter.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    createdInvitationIds.push(invitation.id);

    const revoked = await markPlatformInvitationRevoked(testDb, {
      invitationId: invitation.id,
    });
    expect(revoked?.status).toBe("revoked");

    const accepted = await markPlatformInvitationAccepted(testDb, {
      invitationId: invitation.id,
      acceptedUserId: crypto.randomUUID(),
    });
    expect(accepted).toBeNull();
  });

  test("revoke is idempotent after invitation is already revoked", async () => {
    const inviter = testUser();
    createdUserIds.push(inviter.id);
    await testDb.insert(user).values({
      id: inviter.id,
      email: inviter.email,
      name: inviter.name,
      emailVerified: true,
    });

    const invitation = await createPlatformInvitation(testDb, {
      email: `${crypto.randomUUID()}@invite.test`,
      name: "Invited User",
      role: "public_student",
      tokenHash: hashInvitationToken("revoke-twice-token"),
      inviterName: inviter.name,
      inviterUserId: inviter.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    createdInvitationIds.push(invitation.id);

    const firstRevoke = await markPlatformInvitationRevoked(testDb, {
      invitationId: invitation.id,
    });
    expect(firstRevoke?.status).toBe("revoked");

    const secondRevoke = await markPlatformInvitationRevoked(testDb, {
      invitationId: invitation.id,
    });
    expect(secondRevoke).toBeNull();
  });
});
