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
import { httpLogger } from "@/utils/http-logger";

const app = new Hono();
const faviconFile = Bun.file(new URL("../public/favicon.svg", import.meta.url));
const faviconHref = "/favicon.svg";
const faviconHeaders = {
  "content-type": "image/svg+xml; charset=utf-8",
  "cache-control": "public, max-age=86400",
};

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

app.use("*", httpLogger());

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

app.get("/favicon.svg", () => new Response(faviconFile, { headers: faviconHeaders }));

app.get("/favicon.ico", () => new Response(faviconFile, { headers: faviconHeaders }));

app.get("/", (c) => {
  const origin = new URL(c.req.url).origin;
  const trpcPanelHtml = renderTrpcPanel(appRouter, {
    url: `${origin}/trpc`,
    transformer: "superjson",
  }).replace(
    "</head>",
    `<link rel="icon" href="${faviconHref}" sizes="any" type="image/svg+xml" /></head>`,
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
