import { createLoggerWithContext } from "@sycom/logger";
import { createMiddleware } from "@tanstack/react-start";

import { authClient } from "@/lib/auth/auth-client";

const startFnLogger = createLoggerWithContext("start:fn");

export const sessionMiddleware = createMiddleware().server(async ({ next, request }) => {
  startFnLogger.info("getSession request", {
    method: request.method,
    url: request.url,
  });

  const data = await authClient.getSession({
    fetchOptions: {
      headers: request.headers,
      throw: true,
    },
  });
  return next({
    context: {
      session: data?.session ?? null,
      user: data?.user ?? null,
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
