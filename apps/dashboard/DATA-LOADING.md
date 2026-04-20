# Dashboard data loading playbook

Single place for how the TanStack Start dashboard fetches and consumes data. Aligns with root [`AGENTS.md`](../../AGENTS.md).

## Session

- **Query factory:** [`src/lib/auth/session.ts`](src/lib/auth/session.ts) — stable key `SESSION_QUERY_KEY`, `queryFn` → `getSession` server function, **5 min** `staleTime`.
- **Guards:** `ensureQueryData(sessionQueryOptions())` in route `beforeLoad` wherever you branch on auth (`_auth`, `_authenticated`, `/`, catch-all, etc.). Repeated calls while the query is fresh are **cache hits**, not extra network work.
- **After sign-in:** keep **`removeQueries(SESSION_QUERY_KEY)`** then **`prefetchQuery(sessionQueryOptions())`** before `navigate` so the authenticated layout’s `beforeLoad` sees a warm cache.
- **After sign-out:** **`setQueryData(SESSION_QUERY_KEY, null)`** so the client is unauthenticated without a refetch.
- **Other session changes:** prefer **`invalidateQueries({ queryKey: SESSION_QUERY_KEY })`** so the next `ensureQueryData` refetches.

## Current user (`me`)

- **Preload:** [`src/routes/_authenticated.tsx`](src/routes/_authenticated.tsx) runs `ensureQueryData(trpc.me.get)` in `beforeLoad` and puts `me` on route context.
- **Consumption:** use **`useUser()`** from [`src/lib/auth/authenticated-context.ts`](src/lib/auth/authenticated-context.ts). It subscribes to **`trpc.me.get`** with `initialData` from route context so the shell stays in sync with React Query (including **optimistic updates**).
- **Full context:** **`useAuthenticatedContext()`** / **`useAuthSession()`** when you need layout context beyond `me`.

## Route loaders: critical vs deferred

| Goal                         | Loader                                                     | Component                                              |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Must have before main UI     | `await queryClient.ensureQueryData(trpc.*.queryOptions())` | `useSuspenseQuery` with the same options               |
| Can stream after first paint | `return { p: queryClient.fetchQuery(...) }` (no `await`)   | `<Suspense><Await promise={p}>…</Await></Suspense>`    |
| Slow route transition        | `pendingComponent` on the route                            | Skeleton UI (see `components/dashboard/*-pending.tsx`) |

**Why deferred UI can flash on every navigation:** the route `loader` runs again on each visit. `fetchQuery` still uses the React Query cache — if that query is **fresh** (`staleTime` not expired), the promise usually resolves from cache with **no network** and the Suspense fallback is minimal. If the query is **stale** or **empty**, React Query **refetches**, and you see the fallback for as long as the request takes. Artificial delays in demo API handlers make every refetch look slow; avoid them unless you are debugging Suspense.

**Examples:** [`src/routes/_authenticated/dashboard.tsx`](src/routes/_authenticated/dashboard.tsx), [`src/routes/_authenticated/settings.profile.tsx`](src/routes/_authenticated/settings.profile.tsx), [`src/routes/_authenticated/help.tsx`](src/routes/_authenticated/help.tsx).

## Mutations

- Prefer **`invalidateQueries`** for the affected query keys after success (and in `onSettled` when you want every subscriber consistent).
- For profile-style updates, use **optimistic `setQueryData` on `trpc.me.get`** with rollback in `onError`; reference implementation: **Settings → Profile** (`settings.profile.tsx`).
- Use **`useTRPCClient()`** when you need a custom `useMutation` shape that tRPC’s `mutationOptions()` typing doesn’t allow (e.g. rich `onMutate` context).

## Navigation templates

| Area            | Paths                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Settings layout | `/settings` → redirect to `/settings/profile` ([`settings.index.tsx`](src/routes/_authenticated/settings.index.tsx)) |
| Profile         | `/settings/profile`                                                                                                  |
| Password        | `/settings/password`                                                                                                 |
| Help            | `/help`                                                                                                              |
