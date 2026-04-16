import { trpcServer } from "@hono/trpc-server";
import { auth } from "@sycom/auth";
import { env } from "@sycom/env/server";
import { logger } from "@sycom/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { renderTrpcPanel } from "trpc-ui-zod4";

import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/routers/_app";

const app = new Hono();
const trpcPanelFaviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#09090b" />
  <path
    d="M18 20c0-3.314 2.686-6 6-6h10c6.627 0 12 5.373 12 12v0c0 6.627-5.373 12-12 12h-4v12h-6a6 6 0 0 1-6-6V20Z"
    fill="#fafafa"
  />
  <path
    d="M30 26h4a6 6 0 0 1 0 12h-4V26Z"
    fill="#09090b"
  />
</svg>
`.trim();
const trpcPanelFaviconHref = `data:image/svg+xml,${encodeURIComponent(trpcPanelFaviconSvg)}`;

app.use(secureHeaders());

app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type", "x-trpc-source", "trpc-accept"],
    maxAge: 86400,
  }),
);

app.use("*", async (c, next) => {
  const start = performance.now();
  await next();

  logger.info(`${c.req.method} ${c.req.path}`, {
    status: c.res.status,
    durationMs: Math.round(performance.now() - start),
  });
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
    onError: ({ error, path }) => {
      logger.error(`[tRPC] ${path ?? "unknown"}`, {
        code: error.code,
        message: error.message,
      });
    },
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/favicon.ico", (c) =>
  c.body(trpcPanelFaviconSvg, 200, {
    "content-type": "image/svg+xml; charset=utf-8",
    "cache-control": "public, max-age=86400",
  }),
);

app.get("/", (c) => {
  const origin = new URL(c.req.url).origin;
  const trpcPanelHtml = renderTrpcPanel(appRouter, {
    url: `${origin}/trpc`,
    transformer: "superjson",
  }).replace(
    "</head>",
    `<link rel="icon" href="${trpcPanelFaviconHref}" sizes="any" type="image/svg+xml" /></head>`,
  );

  return c.html(trpcPanelHtml);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  logger.error(`[Hono] ${c.req.method} ${c.req.path}`, {
    message: err.message,
    stack: err.stack,
  });
  return c.json({ error: "Internal Server Error" }, 500);
});

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  const SHUTDOWN_TIMEOUT = 10_000; // 10s

  const shutdownPromise = (async () => {
    try {
      logger.info("Graceful shutdown complete");
    } catch (error) {
      logger.error("Error during shutdown", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      logger.warn("Shutdown timeout reached, forcing exit");
      resolve();
    }, SHUTDOWN_TIMEOUT);
  });

  await Promise.race([shutdownPromise, timeoutPromise]);
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
