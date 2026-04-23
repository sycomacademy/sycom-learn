import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { Context } from "hono";

import { byIp, createRateLimitMiddleware } from "./rate-limit";

type FakeNext = ReturnType<typeof mock>;

type Captured = {
  readonly headers: Record<string, string>;
  readonly jsonBody: unknown;
  readonly jsonStatus: number | undefined;
};

const makeCtx = (
  overrides: {
    method?: string;
    headers?: Record<string, string>;
    path?: string;
  } = {},
): { ctx: Context; captured: Captured } => {
  const outHeaders: Record<string, string> = {};
  let jsonBody: unknown;
  let jsonStatus: number | undefined;

  const ctx = {
    req: {
      method: overrides.method ?? "GET",
      path: overrides.path ?? "/trpc/profile.get",
      header: (name: string) => {
        const h = overrides.headers ?? {};
        return h[name.toLowerCase()] ?? h[name];
      },
    },
    header: (k: string, v: string) => {
      outHeaders[k] = v;
    },
    json: (body: unknown, status?: number) => {
      jsonBody = body;
      jsonStatus = status;
      return { body, status } as unknown as Response;
    },
  } as unknown as Context;

  const captured: Captured = {
    get headers() {
      return outHeaders;
    },
    get jsonBody() {
      return jsonBody;
    },
    get jsonStatus() {
      return jsonStatus;
    },
  };

  return { ctx, captured };
};

// The middleware is a Hono-wrapped async fn `(c, next) => Promise<Response | void>`.
// For a direct call we just cast it to that shape.
type MiddlewareFn = (c: Context, next: FakeNext) => Promise<Response | void>;

describe("createRateLimitMiddleware", () => {
  let now = 1_000_000;
  let dateNowSpy: ReturnType<typeof spyOn> | undefined;

  beforeEach(() => {
    now = 1_000_000;
    dateNowSpy = spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    dateNowSpy?.mockRestore();
  });

  test("OPTIONS short-circuits without counting a hit", async () => {
    const mw = createRateLimitMiddleware({ windowMs: 60_000, limit: 1 }) as unknown as MiddlewareFn;
    const next = mock(async () => {});

    for (let i = 0; i < 3; i++) {
      const { ctx } = makeCtx({
        method: "OPTIONS",
        headers: { "x-forwarded-for": "1.1.1.1" },
      });
      await mw(ctx, next);
    }

    expect(next).toHaveBeenCalledTimes(3);
  });

  test("allows up to the limit, then returns 429 with Retry-After", async () => {
    const mw = createRateLimitMiddleware({
      windowMs: 60_000,
      limit: 2,
      name: "trpc",
    }) as unknown as MiddlewareFn;
    const next = mock(async () => {});

    const call = async () => {
      const { ctx, captured } = makeCtx({ headers: { "x-forwarded-for": "2.2.2.2" } });
      await mw(ctx, next);
      return captured;
    };

    const first = await call();
    const second = await call();
    const third = await call();

    expect(first.jsonStatus).toBeUndefined();
    expect(second.jsonStatus).toBeUndefined();
    expect(third.jsonStatus).toBe(429);
    expect(third.headers["Retry-After"]).toBeDefined();
    expect(third.headers["RateLimit-Remaining"]).toBe("0");
    expect(next).toHaveBeenCalledTimes(2);
  });

  test("error message includes the middleware name when provided", async () => {
    const mw = createRateLimitMiddleware({
      windowMs: 60_000,
      limit: 1,
      name: "trpc",
    }) as unknown as MiddlewareFn;
    const next = mock(async () => {});
    const call = async () => {
      const { ctx, captured } = makeCtx({ headers: { "x-forwarded-for": "5.5.5.5" } });
      await mw(ctx, next);
      return captured;
    };

    await call();
    const blocked = await call();

    expect(blocked.jsonStatus).toBe(429);
    expect((blocked.jsonBody as { error: string }).error).toMatch(/trpc/);
  });

  test("sliding window: a hit older than windowMs is evicted", async () => {
    const mw = createRateLimitMiddleware({
      windowMs: 1_000,
      limit: 1,
    }) as unknown as MiddlewareFn;
    const next = mock(async () => {});

    const call = async () => {
      const { ctx, captured } = makeCtx({ headers: { "x-forwarded-for": "3.3.3.3" } });
      await mw(ctx, next);
      return captured;
    };

    await call(); // t = 1_000_000
    now += 1_500; // past the 1s window
    const second = await call();

    expect(second.jsonStatus).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(2);
  });

  test("keyFn isolates buckets per caller", async () => {
    const mw = createRateLimitMiddleware({
      windowMs: 60_000,
      limit: 1,
      keyFn: (c) => c.req.header("x-user") ?? "anon",
    }) as unknown as MiddlewareFn;
    const next = mock(async () => {});

    const call = async (user: string) => {
      const { ctx, captured } = makeCtx({ headers: { "x-user": user } });
      await mw(ctx, next);
      return captured;
    };

    await call("alice");
    const aliceAgain = await call("alice");
    const bob = await call("bob");

    expect(aliceAgain.jsonStatus).toBe(429);
    expect(bob.jsonStatus).toBeUndefined();
  });

  test("default key is ip + path — different paths get separate buckets", async () => {
    const mw = createRateLimitMiddleware({
      windowMs: 60_000,
      limit: 1,
    }) as unknown as MiddlewareFn;
    const next = mock(async () => {});

    const call = async (path: string) => {
      const { ctx, captured } = makeCtx({
        path,
        headers: { "x-forwarded-for": "4.4.4.4" },
      });
      await mw(ctx, next);
      return captured;
    };

    const a = await call("/a");
    const b = await call("/b");
    const aAgain = await call("/a");

    expect(a.jsonStatus).toBeUndefined();
    expect(b.jsonStatus).toBeUndefined();
    expect(aAgain.jsonStatus).toBe(429);
  });

  test("sets the RateLimit-Limit and RateLimit-Policy headers on allowed requests", async () => {
    const mw = createRateLimitMiddleware({
      windowMs: 60_000,
      limit: 5,
    }) as unknown as MiddlewareFn;
    const next = mock(async () => {});
    const { ctx, captured } = makeCtx({ headers: { "x-forwarded-for": "6.6.6.6" } });

    await mw(ctx, next);

    expect(captured.headers["RateLimit-Limit"]).toBe("5");
    expect(captured.headers["RateLimit-Policy"]).toBe("5;w=60");
    expect(captured.headers["RateLimit-Remaining"]).toBe("4");
  });
});

describe("byIp", () => {
  test("reads x-forwarded-for and splits on comma", () => {
    const { ctx } = makeCtx({ headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" } });
    expect(byIp(ctx)).toBe("9.9.9.9");
  });

  test("falls back to cf-connecting-ip, then x-real-ip, then 'unknown'", () => {
    expect(byIp(makeCtx({ headers: { "cf-connecting-ip": "8.8.8.8" } }).ctx)).toBe("8.8.8.8");
    expect(byIp(makeCtx({ headers: { "x-real-ip": "7.7.7.7" } }).ctx)).toBe("7.7.7.7");
    expect(byIp(makeCtx().ctx)).toBe("unknown");
  });
});
