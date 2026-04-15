import type { AppRouter } from "server/trpc/routers/_app";
import { Toaster } from "@sycom/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { ThemeProvider } from "next-themes";

import ThemeToggle from "@/components/theme-toggle";
import { getUser } from "@/functions/get-user";

import appCss from "../index.css?url";
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    const session = await getUser();
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Outlet />
          <Toaster richColors />
          <ThemeToggle />
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        </ThemeProvider>
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
        <div className="flex min-h-svh items-center justify-center bg-background p-8">
          <div className="flex max-w-sm flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-semibold">Sycom is down</h1>
            <p className="text-sm text-muted-foreground">
              We can&rsquo;t reach the server right now. Please try again in a moment.
            </p>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
