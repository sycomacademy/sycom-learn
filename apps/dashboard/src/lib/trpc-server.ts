import type { AppRouter } from "server/trpc/routers/_app";
import { env } from "@sycom/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export function createServerTRPC(request: Request) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.VITE_SERVER_URL}/trpc`,
        transformer: superjson,
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      }),
    ],
  });
}
