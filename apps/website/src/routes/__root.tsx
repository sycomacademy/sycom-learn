import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import Header from "../components/header";

import appCss from "../index.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sycom LMS — Cybersecurity training built for teams" },
      {
        name: "description",
        content:
          "Multi-tenant cybersecurity LMS with structured learning paths and real-time progress tracking.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  component: RootDocument,
});

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

const legalLinks = [
  { href: "#", label: "Privacy" },
  { href: "#", label: "Terms" },
  { href: "#", label: "Contact" },
];

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
          <SiteFooter />
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <span aria-hidden="true" className="inline-block size-3 bg-primary" />
            Sycom
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Cybersecurity training for teams. Multi-tenant, structured, measurable.
          </p>
        </div>
        <FooterColumn heading="Product" links={productLinks} />
        <FooterColumn heading="Company" links={legalLinks} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-5 font-mono text-xs text-muted-foreground md:flex-row md:items-center">
          <span>&copy; {new Date().getFullYear()} Sycom. All rights reserved.</span>
          <span className="tracking-wider uppercase">Built in the UK · v1</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {heading}
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {links.map(({ href, label }) => (
          <li key={label}>
            <a href={href} className="text-foreground/80 transition-colors hover:text-foreground">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
