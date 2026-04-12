import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import Header from "../components/header";

import appCss from "../index.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sycom" },
      { name: "description", content: "Sycom — build faster." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
          <Header />
          <Outlet />
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Sycom. All rights reserved.</p>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
