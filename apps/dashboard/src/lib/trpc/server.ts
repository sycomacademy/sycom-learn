import type { AppRouter } from "server/trpc/routers/_app";
import { env } from "@sycom/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { getForwardedCookieHeader } from "@/functions/forward-header-cookies";

export const serverTRPC = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.VITE_SERVER_URL}/trpc`,
      transformer: superjson,
      headers: () => getForwardedCookieHeader(),
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
