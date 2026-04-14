import { createDb } from "@sycom/db";
import * as schema from "@sycom/db/schema/auth";
import { env } from "@sycom/env/server";
import { dash } from "@better-auth/infra";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";

import { orgAc, orgRoles, platformAc, platformRoles } from "./permissions";

// Email stubs — replace with a real provider (Resend/Postmark/SES) before
// shipping. In dev, they log the URL so you can copy/paste it. In prod, they
// throw loudly so signups fail visibly instead of silently skipping
// verification.
const devOrThrow = (label: string, to: string, url: string) => {
  if (env.NODE_ENV === "production") {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: `Email provider not configured (${label}). Configure one before enabling in production.`,
    });
  }
  console.log(`[auth:${label}] to=${to} url=${url}`);
};

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
        sameSite: "none",
        secure: true,
        httpOnly: true,
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
      sendVerificationEmail: async ({ user, url }) => {
        devOrThrow("verify-email", user.email, url);
      },
    },
    plugins: [
      organization({
        ac: orgAc,
        roles: orgRoles,
        creatorRole: "platform_admin",
        allowUserToCreateOrganization: async (_user) => {
          // const role = user.role as UserRole;
          // return role === "platform_admin";
          return true;
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
  });
}

export const auth = createAuth();
