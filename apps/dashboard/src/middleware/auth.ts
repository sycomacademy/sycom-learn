import { createMiddleware } from "@tanstack/react-start";

import { authClient } from "@/lib/auth/auth-client";

export const sessionMiddleware = createMiddleware().server(async ({ next, request }) => {
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
