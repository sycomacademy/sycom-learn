import { recordAuditEvent } from "@sycom/db/queries/index";
import { createAuthMiddleware } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";

type Db = Parameters<typeof recordAuditEvent>[0];

type HookCtx = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

const AFTER_PATH_EVENT: Record<string, string> = {
  "/sign-up/email": "auth.signup",
  "/sign-in/email": "auth.signin.success",
  "/sign-in/social": "auth.signin.success",
  "/sign-in/passkey": "auth.signin.success",
  "/sign-in/magic-link": "auth.signin.success",
  "/sign-in/email-otp": "auth.signin.success",
  "/verify-email": "auth.email.verified",
  "/change-email": "auth.email.changed",
  "/change-password": "auth.password.changed",
  "/reset-password": "auth.password.changed",
  "/forget-password": "auth.password.reset_requested",
  "/send-verification-email": "auth.email.verification_sent",
  "/link-social": "auth.account.linked",
  "/unlink-account": "auth.account.unlinked",
  "/two-factor/enable": "auth.2fa.enabled",
  "/two-factor/disable": "auth.2fa.disabled",
  "/two-factor/verify-totp": "auth.2fa.verified",
  "/two-factor/verify-backup-code": "auth.2fa.verified",
  "/two-factor/verify-otp": "auth.2fa.verified",
  "/passkey/verify-registration": "auth.passkey.registered",
  "/passkey/delete-passkey": "auth.passkey.removed",
};

const BEFORE_PATH_EVENT: Record<string, string> = {
  "/sign-out": "auth.signout",
  "/delete-user": "auth.user.deleted",
  "/revoke-session": "auth.session.revoked",
  "/revoke-other-sessions": "auth.session.revoked",
  "/revoke-sessions": "auth.session.revoked",
};

function isOAuthCallback(path: string | undefined): boolean {
  return !!path && (path.startsWith("/callback/") || path.startsWith("/oauth2/callback/"));
}

function pickHeader(ctx: HookCtx, name: string): string | null {
  const fromHeaders = ctx.headers?.get(name);
  if (fromHeaders) return fromHeaders;
  const fromRequest = ctx.request?.headers.get(name);
  return fromRequest ?? null;
}

function extractIp(ctx: HookCtx): string | null {
  const forwarded = pickHeader(ctx, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return pickHeader(ctx, "x-real-ip") ?? pickHeader(ctx, "x-vercel-forwarded-for") ?? null;
}

function extractActorId(ctx: HookCtx): string | null {
  const session = ctx.context.session;
  if (session?.user?.id) return session.user.id;
  const newSession = ctx.context.newSession;
  if (newSession?.user?.id) return newSession.user.id;
  return null;
}

function buildMetadata(path: string): Record<string, unknown> | null {
  if (path === "/revoke-session") return { scope: "self" };
  if (path === "/revoke-other-sessions") return { scope: "others" };
  if (path === "/revoke-sessions") return { scope: "all" };
  if (path === "/sign-in/email") return { provider: "email" };
  if (path === "/sign-up/email") return { provider: "email" };
  if (path === "/sign-in/passkey") return { provider: "passkey" };
  if (path === "/sign-in/magic-link") return { provider: "magic-link" };
  if (path === "/sign-in/email-otp") return { provider: "email-otp" };
  if (isOAuthCallback(path)) {
    const provider = path.split("/").pop() ?? "oauth";
    return { provider };
  }
  return null;
}

async function record(db: Db, ctx: HookCtx, event: string): Promise<void> {
  const path = ctx.path ?? "";
  const actorId = extractActorId(ctx);
  try {
    await recordAuditEvent(db, {
      actorId,
      actorType: actorId ? "user" : "system",
      event,
      entityType: null,
      entityId: null,
      organizationId: null,
      metadata: buildMetadata(path),
      ip: extractIp(ctx),
      userAgent: pickHeader(ctx, "user-agent"),
    });
  } catch (error) {
    console.error("[audit-plugin] failed to record event", { event, path, error });
  }
}

export function auditPlugin({ db }: { db: Db }): BetterAuthPlugin {
  return {
    id: "sycom-audit",
    hooks: {
      before: [
        {
          matcher: (ctx) => !!ctx.path && ctx.path in BEFORE_PATH_EVENT,
          handler: createAuthMiddleware(async (ctx) => {
            const event = BEFORE_PATH_EVENT[ctx.path ?? ""];
            if (event) await record(db, ctx, event);
          }),
        },
      ],
      after: [
        {
          matcher: (ctx) =>
            !!ctx.path && (ctx.path in AFTER_PATH_EVENT || isOAuthCallback(ctx.path)),
          handler: createAuthMiddleware(async (ctx) => {
            const path = ctx.path ?? "";
            const event =
              AFTER_PATH_EVENT[path] ?? (isOAuthCallback(path) ? "auth.signin.success" : null);
            if (event) await record(db, ctx, event);
          }),
        },
      ],
    },
  };
}
