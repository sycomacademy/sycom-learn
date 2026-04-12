import type { AppRouter } from "server/trpc/routers/_app";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext, createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: query.invalidate,
        },
      });
    },
  }),
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

const trpcContext = createTRPCContext<AppRouter>();

export const TRPCProvider = trpcContext.TRPCProvider;
