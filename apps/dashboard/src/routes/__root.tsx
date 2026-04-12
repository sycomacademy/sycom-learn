import { Toaster } from "@sycom/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  ClientOnly,
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/lib/trpc";

import "../index.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
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
        title: "sycom",
      },
      {
        name: "description",
        content: "sycom is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Header />
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      {import.meta.env.DEV ? (
        <ClientOnly>
          <>
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
          </>
        </ClientOnly>
      ) : null}
    </RootDocument>
  );
}

function RootDocument({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
