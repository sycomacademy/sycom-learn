import type { Context } from "hono";
import { createMiddleware } from "hono/factory";

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  message?: string;
  keyFn?: (c: Context) => string;
  name?: string;
};

type RateLimitEntry = {
  hits: number[];
};

const clientIp = (c: Context) => {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip") ?? "unknown";
};

export const byIp = (c: Context) => clientIp(c);

export const createRateLimitMiddleware = ({
  windowMs,
  limit,
  message,
  keyFn,
  name,
}: RateLimitOptions) => {
  const store = new Map<string, RateLimitEntry>();
  let lastCleanupAt = 0;

  return createMiddleware(async (c, next) => {
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    const now = Date.now();
    if (now - lastCleanupAt >= 60_000) {
      lastCleanupAt = now;
      for (const [key, bucket] of store.entries()) {
        if (bucket.hits.length === 0) {
          store.delete(key);
        }
      }
    }

    const key = keyFn ? keyFn(c) : `${clientIp(c)}:${c.req.path}`;
    const bucket = store.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((hit) => hit > now - windowMs);

    const oldestHit = bucket.hits[0];
    const resetSeconds = oldestHit
      ? Math.max(1, Math.ceil((oldestHit + windowMs - now) / 1_000))
      : Math.max(1, Math.ceil(windowMs / 1_000));

    c.header("RateLimit-Limit", String(limit));
    c.header("RateLimit-Policy", `${limit};w=${Math.floor(windowMs / 1_000)}`);

    if (bucket.hits.length >= limit) {
      c.header("RateLimit-Remaining", "0");
      c.header("RateLimit-Reset", String(resetSeconds));
      c.header("Retry-After", String(resetSeconds));
      return c.json({ error: message ?? `Rate limit exceeded${name ? ` (${name})` : ""}` }, 429);
    }

    bucket.hits.push(now);
    store.set(key, bucket);

    const remaining = Math.max(limit - bucket.hits.length, 0);
    c.header("RateLimit-Remaining", String(remaining));
    c.header("RateLimit-Reset", String(resetSeconds));

    await next();
  });
};
