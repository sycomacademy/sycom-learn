import { readdirSync } from "node:fs";

// The TanStack Start build emits this; types aren't generated for it.
// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-expect-error untyped runtime import
import handler from "./dist/server/server.js";

type StartHandler = { fetch: (req: Request) => Promise<Response> };
const start = handler as StartHandler;

const UPSTREAM = process.env.INTERNAL_SERVER_URL ?? "http://localhost:3001";
const upstream = new URL(UPSTREAM);

const PROXY_PREFIXES = ["/api/auth", "/trpc"];

const STATIC_ROOT = "./dist/client";
const ASSETS_DIR = `${STATIC_ROOT}/assets`;

const ROOT_STATIC_FILE_RE =
  /^\/[^/]+\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|otf|txt|xml|webmanifest)$/i;

// Strips the Vite `-<hash>` suffix (default 8 base64url chars) from an asset
// file name, yielding the stable base (e.g. `index-ckuBbtiJ.css` -> `index`).
const HASH_SUFFIX_RE = /-[A-Za-z0-9_-]{8}\.css$/;

function shouldProxy(pathname: string): boolean {
  return PROXY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function shouldServeStatic(pathname: string): boolean {
  return pathname.startsWith("/assets/") || ROOT_STATIC_FILE_RE.test(pathname);
}

// Base name (sans hash) -> actual emitted CSS file name. The TanStack Start SSR
// build can render a stylesheet href whose content hash drifts from the
// client-emitted file (Tailwind generates CSS per build environment, and the
// hashes diverge on some build hosts). Only the client file lands on disk, so
// the SSR href 404s and falls through to the app, which 307-redirects assets to
// /sign-in — leaving the whole site unstyled. We resolve the request by its
// stable base name as a fallback so the stylesheet always loads.
let cssByBase: Map<string, string> | null = null;
function cssBaseMap(): Map<string, string> {
  if (cssByBase) return cssByBase;
  const map = new Map<string, string>();
  try {
    for (const name of readdirSync(ASSETS_DIR)) {
      if (name.endsWith(".css")) map.set(name.replace(HASH_SUFFIX_RE, ""), name);
    }
  } catch {
    // Assets dir missing in unexpected layouts; fall back to no resolution.
  }
  cssByBase = map;
  return map;
}

function resolveCssFallback(pathname: string): string | null {
  if (!pathname.startsWith("/assets/") || !pathname.endsWith(".css")) return null;
  const base = pathname.slice("/assets/".length).replace(HASH_SUFFIX_RE, "");
  const actual = cssBaseMap().get(base);
  return actual ? `${ASSETS_DIR}/${actual}` : null;
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

async function serveStatic(pathname: string): Promise<Response | null> {
  const file = Bun.file(`${STATIC_ROOT}${pathname}`);
  if (await file.exists()) {
    return new Response(file, {
      headers: {
        "cache-control": pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
      },
    });
  }
  // Exact file missing: try resolving a drifted CSS hash to the real file.
  // Not immutable — the requested (wrong) hash can map to different content
  // across deploys, so cache it modestly instead of forever.
  const fallback = resolveCssFallback(pathname);
  if (fallback) {
    const css = Bun.file(fallback);
    if (await css.exists()) {
      return new Response(css, { headers: { "cache-control": "public, max-age=3600" } });
    }
  }
  return null;
}

export default {
  port: Number(process.env.PORT ?? 3000),
  hostname: process.env.HOST ?? "0.0.0.0",
  async fetch(req: Request) {
    const { pathname } = new URL(req.url);
    // Liveness/startup probes hit /health. Answer here with a plain, immediately
    // closing response — the SSR /health route streams its body and never
    // terminates within the probe timeout, leaving replicas Unhealthy.
    if (pathname === "/health") {
      return new Response("ok", { headers: { "content-type": "text/plain" } });
    }
    if (shouldProxy(pathname)) return proxy(req);
    if (shouldServeStatic(pathname)) {
      const res = await serveStatic(pathname);
      if (res) return res;
    }
    return start.fetch(req);
  },
};
