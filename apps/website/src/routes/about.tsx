import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "About — Sycom" }],
  }),
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">About</h1>
      <div className="space-y-4 text-muted-foreground">
        <p>
          Sycom is a full-stack monorepo starter built with TanStack Start, Hono, Drizzle, tRPC, and
          Better Auth. It ships two apps from a single repo:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong className="text-foreground">Website</strong> — this SSR public site for
            marketing and SEO pages.
          </li>
          <li>
            <strong className="text-foreground">Dashboard</strong> — an authenticated SPA for app
            features.
          </li>
        </ul>
        <p>
          Shared packages provide a unified component library, database layer, auth configuration,
          and type-safe environment variables across both apps.
        </p>
      </div>

      <h2 className="mt-10 mb-3 text-xl font-semibold">Tech Stack</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {stack.map((item) => (
          <div key={item.name} className="rounded-md border px-4 py-3">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.role}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

const stack = [
  { name: "TanStack Start", role: "SSR framework & routing" },
  { name: "Hono", role: "HTTP server & API layer" },
  { name: "tRPC", role: "End-to-end type-safe RPCs" },
  { name: "Drizzle + Neon", role: "ORM & serverless Postgres" },
  { name: "Better Auth", role: "Authentication & sessions" },
  { name: "Turborepo", role: "Monorepo build orchestration" },
];
