import { createDb } from "@sycom/db";
import * as schema from "@sycom/db/schema/auth";
import { env } from "@sycom/env/server";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { orgAc, orgRoles, platformAc, platformRoles } from "./permissions";
import type { UserRole } from "@sycom/db/schema/auth";
import { betterAuthLogger, devOrThrow } from "./config";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    appName: "Sycom",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.CORS_ORIGIN,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: true,
        httpOnly: true,
      },
      crossSubDomainCookies: {
        enabled: true,
      },
      useSecureCookies: env.NODE_ENV === "production",
      //   ipAddress: {
      //     ipAddressHeaders: [
      //       process.env.NODE_ENV === "production"
      //         ? "x-vercel-forwarded-for"
      //         : "cf-connecting-ip",
      //       // "x-forwarded-for",
      //     ],
      //   },
      // TODO(security): before going to production, set ipAddressHeaders to
      // match the deployment's trusted proxy header (e.g.
      // ["x-vercel-forwarded-for"] on Vercel, ["cf-connecting-ip"] on
      // Cloudflare). Default reads x-forwarded-for, which is spoofable when
      // not behind a known proxy and lets attackers bypass rate limits.
    },

    experimental: {
      joins: true,
    },
    // account: {
    //   accountLinking: {
    //     enabled: true,
    //     trustedProviders: ["google", "linkedin"],
    //   },
    // },
    session: {
      expiresIn: 60 * 60 * 24,
      updateAge: 60 * 60 * 1,
      // Disable cookie cache to avoid getSession returning null in API routes (better-auth#7008)
      cookieCache: { enabled: false },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        devOrThrow("reset-password", user.email, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24,
      sendVerificationEmail: async ({ user, url }) => {
        devOrThrow("verify-email", user.email, url);
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-up/email": { window: 60 * 60, max: 5 },
        "/send-verification-email": { window: 60 * 60, max: 3 },
        "/sign-in/email": { window: 60, max: 10 },
        "/forget-password": { window: 60 * 60, max: 3 },
      },
    },
    user: {
      additionalFields: {
        onboardedAt: { type: "date", required: false, input: false },
      },
    },
    plugins: [
      organization({
        ac: orgAc,
        roles: orgRoles,
        creatorRole: "owner",
        allowUserToCreateOrganization: async (user) => {
          const role = user.role as UserRole;
          return role === "platform_admin";
        },
        teams: {
          enabled: true,
        },
        schema: {
          team: { modelName: "cohort" },
          teamMember: { modelName: "cohort_member" },
        },
        sendInvitationEmail: async (data) => {
          const inviteUrl = `${env.BETTER_AUTH_URL}/invite/${data.id}`;
          devOrThrow("org-invite", data.email, inviteUrl);
        },
      }),
      admin({
        ac: platformAc,
        roles: platformRoles,
        defaultRole: "public_student",
      }),
      dash(),
    ],
    ...betterAuthLogger,
  });
}

export const auth = createAuth();
