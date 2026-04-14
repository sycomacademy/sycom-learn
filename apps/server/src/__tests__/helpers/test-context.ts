import { db } from "@sycom/db";
import type { Context } from "../../trpc/context";

type TestContextOptions = {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  authenticated?: boolean;
};

export function createTestContext(opts: TestContextOptions = {}): Context {
  const {
    userId = "test-user-id",
    userName = "Test User",
    userEmail = "test@sycom.test",
    userRole = "public_student",
    authenticated = true,
  } = opts;

  const session = authenticated
    ? {
        session: {
          id: "test-session-id",
          token: "test-token",
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId,
          ipAddress: "127.0.0.1",
          userAgent: "test-agent",
        },
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: userRole,
          banned: false,
          banReason: null,
          banExpires: null,
        },
      }
    : null;

  return {
    headers: new Headers(),
    session,
    db,
  };
}

export function createUnauthenticatedContext(): Context {
  return createTestContext({ authenticated: false });
}
