# AGENTS.md

This file provides guidance to agents (Claude Code, Cursor, OpenCode, etc.) when working with code in this repository. `CLAUDE.md` and `.cursor/rules/main.mdc` both point here — treat this as the single source of truth.

## Rules

These rules override default agent behavior. Apply them by default; only deviate if the user explicitly asks for something different.

1. **Never fetch derivable data.** If auth state or any other value is resolvable via router context, a parent route's `beforeLoad`/`loader`, or existing query cache, read it from there — do not issue a second network call. In the dashboard app, the session is fetched once in the root route and exposed via `Route.useRouteContext()`; components must never call `authClient.useSession()`.

2. **Invalidate, don't re-navigate, on state change.** After auth mutations (`signIn`, `signUp`, `signOut`) or any write that alters session/permissions, call `router.invalidate()`. `beforeLoad` re-runs and handles redirects — avoid manually chaining `navigate()` calls that duplicate routing logic.

3. **Prefer route `loader` / `beforeLoad` over in-component queries for initial data.** Components should render data that's already been fetched by the route. Reserve `useQuery` for interactive refetches, mutations' optimistic invalidation, or data that genuinely loads after mount.

4. **Cache aggressively.** The QueryClient default is `staleTime: 60_000`. Do not set `defaultPreloadStaleTime: 0` — it defeats preloading. Invalidate on writes; never refetch on every navigation.

5. **Lazy-load heavy or non-critical dependencies.** Animation libraries, markdown renderers, chart libraries, and below-the-fold components should be `React.lazy`'d so they stay out of the initial bundle. For `motion`, prefer `m` + `<LazyMotion features={domAnimation}>` over the default `motion` component.

6. **No dead pages.** The dashboard app is fully auth-gated — public marketing/SEO content lives in `apps/website`. If a route has no purpose, delete it or convert it to a redirect. Don't leave health-check placeholders in production routes.

## Commands

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Start all apps (dashboard + website + server) in dev mode
bun run dev:dashboard    # Start only the dashboard app
bun run dev:website      # Start only the website app
bun run dev:server       # Start only the server
bun run build            # Build all apps
bun run check-types      # TypeScript type checking across all packages
bun run check            # Run oxlint + oxfmt (formatting with --write)

# Database (Drizzle + Neon Postgres)
bun run db:push          # Push schema changes to database
bun run db:generate      # Generate migration files
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio

# Turborepo filtering (run tasks in specific packages)
turbo -F dashboard <task>
turbo -F website <task>
turbo -F server <task>
turbo -F @sycom/db <task>
turbo -F @sycom/trpc <task>
```

## Architecture

Turborepo monorepo using Bun as runtime and package manager.

### Apps

- **`apps/dashboard`** - Authenticated SPA (React + TanStack Router + tRPC). Auth, dashboard, and app features. Vite dev server on port 3001. Uses `@` path alias for `src/`.
- **`apps/website`** - Public-facing website for SEO/marketing pages. React + TanStack Router, no auth dependencies. Vite dev server on port 3002. Uses `@` path alias for `src/`.
- **`apps/server`** - Hono HTTP server with hot reload (`bun run --hot`). Mounts Better Auth at `/api/auth/*` and tRPC at `/trpc/*`. Entry point: `src/index.ts`. tRPC routers and middleware live under `src/trpc/` (`routers/_app.ts` merges sub-routers). `src/utils/` for server-only helpers.

### Packages

- **`@sycom/trpc`** - Shared tRPC request context only (`packages/trpc/src/context.ts`): `createContext()` resolves the Better Auth session from Hono request headers. Routers and procedures are defined in `apps/server/src/trpc/`.
- **`@sycom/db`** - Drizzle ORM setup with Neon serverless driver. Schema files in `src/schema/`. Drizzle config reads `.env` from `apps/server/.env`.
- **`@sycom/auth`** - Better Auth configuration with Drizzle adapter and email/password auth.
- **`@sycom/env`** - Type-safe env validation via `@t3-oss/env-core`. Exports `env` from `./server` (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGIN) and `./web` (VITE_SERVER_URL).
- **`@sycom/ui`** - Shared shadcn/ui components (style: `base-lyra`). Import as `@sycom/ui/components/<name>`. Global styles in `src/styles/globals.css`.
- **`@sycom/config`** - Shared base tsconfig.

### Key data flow

Dashboard creates a tRPC client pointing at `VITE_SERVER_URL/trpc` with credentials included. It imports the `AppRouter` type from the `server` workspace package (`server/trpc/routers/_app`). The server's tRPC middleware calls `createContext()` from `@sycom/trpc` which resolves the user session from request headers via Better Auth. Protected procedures enforce authentication.

### shadcn/ui setup

Three `components.json` files exist:

- `packages/ui/components.json` - for shared primitives (add with `-c packages/ui`)
- `apps/dashboard/components.json` - for dashboard-specific components (run from `apps/dashboard`)
- `apps/website/components.json` - for website-specific components (run from `apps/website`)

All use `base-lyra` style and lucide icons.

## Linting & Formatting

Oxlint (with typescript, unicorn, oxc, react, jsx-a11y plugins) and Oxfmt. Pre-commit hook via Lefthook auto-fixes staged files. No ESLint/Prettier/Biome.

## Environment

Server env lives in `apps/server/.env`. Required variables: `DATABASE_URL`, `BETTER_AUTH_SECRET` (min 32 chars), `BETTER_AUTH_URL`, `CORS_ORIGIN`. Web env uses `VITE_` prefixed variables.
