import type { AppRouter } from "server/trpc/routers/_app";
import { env } from "@sycom/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { getForwardedCookieHeader } from "@/functions/forward-header-cookies";

// This client only runs on the server (createServerFn). Prefer the
// Container Apps internal FQDN to avoid the same-env hairpin that hangs
// public-FQDN calls between two apps in one environment.
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
