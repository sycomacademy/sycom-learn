import { describe, expect, test } from "bun:test";
import "./setup-env";

import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import { assertPlatformPermission, hasPlatformPermission } from "../middleware/permissions";
import { testUser } from "./helpers";

const makeSession = (role?: string | null): NonNullable<Context["session"]> => {
  const now = new Date();
  const user = testUser({ role });

  return {
    session: {
      id: `test-session-${user.id}`,
      token: `test-token-${user.id}`,
      userId: user.id,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      ipAddress: null,
      userAgent: null,
      activeOrganizationId: null,
      createdAt: now,
      updatedAt: now,
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: true,
      image: null,
      role,
      twoFactorEnabled: false,
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: now,
      updatedAt: now,
    },
  } as NonNullable<Context["session"]>;
};

describe("platform permission helpers", () => {
  test("platform_admin can perform admin actions", () => {
    const session = makeSession("platform_admin");

    expect(hasPlatformPermission(session, { user: ["set-role"] })).toBe(true);
  });

  test("public_student cannot perform admin actions", () => {
    const session = makeSession("public_student");

    expect(hasPlatformPermission(session, { user: ["set-role"] })).toBe(false);
  });

  test("platform_admin can generate courses with AI", () => {
    const session = makeSession("platform_admin");

    expect(hasPlatformPermission(session, { course: ["generate"] })).toBe(true);
  });

  test("content_creator can generate courses with AI", () => {
    const session = makeSession("content_creator");

    expect(hasPlatformPermission(session, { course: ["generate"] })).toBe(true);
  });

  test("public_student cannot generate courses with AI", () => {
    const session = makeSession("public_student");

    expect(hasPlatformPermission(session, { course: ["generate"] })).toBe(false);
  });

  test("assertPlatformPermission throws for forbidden action", () => {
    const session = makeSession("content_creator");

    expect(() => assertPlatformPermission(session, { user: ["set-role"] })).toThrow(TRPCError);
  });

  test("assertPlatformPermission throws when unauthenticated", () => {
    expect(() => assertPlatformPermission(null, { report: ["list"] })).toThrow(TRPCError);
  });
});
