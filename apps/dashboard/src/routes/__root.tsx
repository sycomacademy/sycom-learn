import type { AppRouter } from "server/trpc/routers/_app";
import { AnchoredToastProvider, ToastProvider } from "@sycom/ui/components/toast";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { LazyMotion, domAnimation } from "motion/react";
import { ThemeProvider } from "next-themes";

import GlobalError from "@/components/layout/global-error";
import ThemeToggle from "@/components/theme-toggle";
import { getUser } from "@/functions/get-user";

import appCss from "../index.css?url";
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      queryKey: ["session"],
      queryFn: () => getUser(),
    });
    return { session };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Sycom",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),

  component: RootComponent,
  errorComponent: RootError,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <LazyMotion features={domAnimation} strict>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <ToastProvider>
              <AnchoredToastProvider>
                {children}
                <ThemeToggle />
                <TanStackRouterDevtools position="bottom-left" />
                <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
              </AnchoredToastProvider>
            </ToastProvider>
          </ThemeProvider>
        </LazyMotion>
        <Scripts />
      </body>
    </html>
  );
}

function RootError() {
  return (
    <RootDocument>
      <GlobalError />
    </RootDocument>
  );
}
