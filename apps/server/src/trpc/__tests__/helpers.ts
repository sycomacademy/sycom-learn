import "./setup-env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@sycom/db/schema/index";

import { callerFactory } from "../init";
import { appRouter } from "../routers/_app";
import type { Context } from "../context";

const createCaller = callerFactory(appRouter);
type Caller = ReturnType<typeof createCaller>;

// DB-backed tests require an explicit TEST_DATABASE_URL so we never run them
// against the main DATABASE_URL by accident. When TEST_DATABASE_URL is unset,
// DB-backed `describe` blocks should use `describe.skipIf(!dbEnabled)`.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

export const dbEnabled = Boolean(testDatabaseUrl);

export const testDb = testDatabaseUrl
  ? drizzle(neon(testDatabaseUrl), { schema })
  : // Not used when dbEnabled is false; kept typed so callers don't have to
    // narrow. The schema-typed object is fine as a standin.
    (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type MakeCallerOptions = {
  user?: SessionUser | null;
  activeOrganizationId?: string | null;
};

// Construct a tRPC caller with a hand-built context. The shapes below match
// what createContext produces in production: { headers, session, db }. We cast
// session to the expected type because Better Auth's session objects carry a
// lot of derived fields that aren't relevant to the middleware guard.
export const makeCaller = (opts: MakeCallerOptions = {}): Caller => {
  const { user = null, activeOrganizationId = null } = opts;

  const now = new Date();
  const session = user
    ? ({
        session: {
          id: `test-session-${user.id}`,
          token: `test-token-${user.id}`,
          userId: user.id,
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
          ipAddress: null,
          userAgent: null,
          activeOrganizationId,
          createdAt: now,
          updatedAt: now,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified ?? true,
          image: user.image ?? null,
          role: user.role ?? null,
          banned: user.banned ?? false,
          banReason: user.banReason ?? null,
          banExpires: user.banExpires ?? null,
          createdAt: user.createdAt ?? now,
          updatedAt: user.updatedAt ?? now,
        },
      } as unknown as NonNullable<Context["session"]>)
    : null;

  const ctx: Context = {
    context: {} as Context["context"],
    headers: new Headers(),
    session,
    db: testDb,
  };

  return createCaller(ctx);
};

export const testUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: `test-user-${crypto.randomUUID()}`,
  email: `${crypto.randomUUID()}@test.local`,
  name: "Test User",
  emailVerified: true,
  ...overrides,
});
