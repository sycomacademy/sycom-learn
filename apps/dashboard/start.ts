// The TanStack Start build emits this; types aren't generated for it.
// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-expect-error untyped runtime import
import handler from "./dist/server/server.js";

type StartHandler = { fetch: (req: Request) => Promise<Response> };
const start = handler as StartHandler;

const UPSTREAM = process.env.INTERNAL_SERVER_URL ?? "http://localhost:3001";
const upstream = new URL(UPSTREAM);

const PROXY_PREFIXES = ["/api/auth", "/trpc"];

function shouldProxy(pathname: string): boolean {
  return PROXY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function proxy(req: Request): Promise<Response> {
  const inbound = new URL(req.url);
  const target = new URL(inbound.pathname + inbound.search, upstream);
  return fetch(target, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    redirect: "manual",
  });
}

export default {
  port: Number(process.env.PORT ?? 3000),
  hostname: process.env.HOST ?? "0.0.0.0",
  async fetch(req: Request) {
    const { pathname } = new URL(req.url);
    if (shouldProxy(pathname)) return proxy(req);
    return start.fetch(req);
  },
};
