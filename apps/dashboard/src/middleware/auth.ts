import { createLoggerWithContext } from "@sycom/logger";
import { createMiddleware } from "@tanstack/react-start";

import { authClient } from "@/lib/auth/auth-client";

const startFnLogger = createLoggerWithContext("start:fn");

export const sessionMiddleware = createMiddleware().server(async ({ next, request }) => {
  const cookie = request.headers.get("cookie") ?? "";

  startFnLogger.info("getSession request", {
    method: request.method,
    url: request.url,
  });

  const data = await authClient.getSession({
    fetchOptions: {
      headers: cookie ? { cookie } : {},
      throw: true,
    },
  });

  const payload = data as {
    data?: { session?: unknown; user?: unknown } | null;
    session?: unknown;
    user?: unknown;
  };

  const session = payload.data?.session ?? payload.session ?? null;
  const user = payload.data?.user ?? payload.user ?? null;

  return next({
    context: {
      session,
      user,
    },
  });
});

export const requireSessionMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session || !context.user) {
      throw new Error("UNAUTHORIZED");
    }
    return next({
      context: { session: context.session, user: context.user },
    });
  });
