import type { Context } from "../context";

/**
 * Best-effort client IP / UA for application-layer audit rows (matches what the
 * auth audit plugin reads from the incoming Better Auth request).
 */
export function auditRequestMeta(
  ctx: Context,
): Readonly<{ ip: string | null; userAgent: string | null }> {
  const headers = ctx.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    null;
  return { ip, userAgent: headers.get("user-agent") };
}
