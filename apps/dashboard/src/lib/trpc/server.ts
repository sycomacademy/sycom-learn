import type { AppRouter } from "server/trpc/routers/_app";
import { env } from "@sycom/env/web";
import { getRequest } from "@tanstack/react-start/server";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export const serverTRPC = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.VITE_SERVER_URL}/trpc`,
      transformer: superjson,
      async headers() {
        const cookie = getRequest().headers.get("cookie") ?? "";
        return cookie ? { cookie } : {};
      },
    }),
  ],
});
