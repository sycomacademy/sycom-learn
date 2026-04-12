import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import Loader from "./components/loader";
import { TRPCProvider, queryClient, trpc, trpcClient } from "./lib/trpc";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { trpc, queryClient },
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            {children}
          </TRPCProvider>
        </QueryClientProvider>
      );
    },
  });
  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
