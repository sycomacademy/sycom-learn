import { auth } from "@sycom/auth";
import { createMiddleware, createStart } from "@tanstack/react-start";

const sessionMiddleware = createMiddleware().server(async ({ next, request }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return next({
    context: { session },
  });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [sessionMiddleware],
}));
