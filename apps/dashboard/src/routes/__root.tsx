import type { AppRouter } from "server/trpc/routers/_app";
import { Toaster } from "@sycom/ui/components/sonner";
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

  component: RootDocument,
  errorComponent: RootError,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <LazyMotion features={domAnimation} strict>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Outlet />
            <Toaster richColors />
            <ThemeToggle />
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
          </ThemeProvider>
        </LazyMotion>
        <Scripts />
      </body>
    </html>
  );
}

function RootError() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <LazyMotion features={domAnimation} strict>
          <GlobalError />
        </LazyMotion>
        <Scripts />
      </body>
    </html>
  );
}
