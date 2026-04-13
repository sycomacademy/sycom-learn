import { trpcServer } from "@hono/trpc-server";
import { auth } from "@sycom/auth";
import { env } from "@sycom/env/server";
import { closeLogger, logger } from "@sycom/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { renderTrpcPanel } from "trpc-ui-zod4";

import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/routers/_app";

const app = new Hono();

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

app.get("/", (c) => {
  const origin = new URL(c.req.url).origin;
  return c.html(
    renderTrpcPanel(appRouter, {
      url: `${origin}/trpc`,
      transformer: "superjson",
    }),
  );
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

let shuttingDown = false;
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}, shutting down...`);
  await closeLogger();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
