import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Layers, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <section className="flex flex-col items-center gap-6 px-4 py-24 text-center">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          SSR-powered by TanStack Start
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Ship your next project with confidence
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          A full-stack monorepo template with SSR, type-safe APIs, and a component library &mdash;
          ready to go.
        </p>
        <div className="flex gap-3 pt-2">
          <a
            href="https://github.com"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started <ArrowRight size={16} />
          </a>
          <a
            href="/about"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Learn More
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border p-6">
            <div className="mb-3 inline-flex rounded-md bg-primary/10 p-2 text-primary">
              {f.icon}
            </div>
            <h3 className="mb-1 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

const features = [
  {
    title: "Server-Side Rendering",
    description:
      "Pages render on the server for fast initial loads, great SEO, and smooth client-side transitions.",
    icon: <Zap size={20} />,
  },
  {
    title: "Type-Safe End to End",
    description:
      "From database schema to API layer to frontend — full TypeScript coverage with tRPC and Drizzle.",
    icon: <Shield size={20} />,
  },
  {
    title: "Monorepo Architecture",
    description:
      "Shared packages for UI, auth, and config. Turborepo handles builds, caching, and task orchestration.",
    icon: <Layers size={20} />,
  },
];
