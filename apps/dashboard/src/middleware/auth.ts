import { auth } from "@sycom/auth";
import { createMiddleware } from "@tanstack/react-start";

export const sessionMiddleware = createMiddleware().server(async ({ next, request }) => {
  const data = await auth.api.getSession({ headers: request.headers });
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
