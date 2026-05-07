import type { AppRouter } from "server/trpc/routers/_app";
import { env } from "@sycom/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { getForwardedCookieHeader } from "@/functions/forward-header-cookies";

// Server-only client. Talk directly to the server container over loopback
// via INTERNAL_SERVER_URL (set in Bicep) instead of looping back through
// the dashboard's own /trpc proxy.
const baseURL = process.env.INTERNAL_SERVER_URL ?? env.VITE_SERVER_URL;

export const serverTRPC = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${baseURL}/trpc`,
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
