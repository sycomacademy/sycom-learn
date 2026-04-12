import { trpcServer } from "@hono/trpc-server";
import { auth } from "@sycom/auth";
import { env } from "@sycom/env/server";
import { createContext } from "@sycom/trpc";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { appRouter } from "./trpc/routers/_app";

const app = new Hono();

app.use(logger());
app.use(secureHeaders());

app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "x-trpc-source",
      "trpc-accept",
    ],
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
      console.error(`[tRPC] ${path ?? "unknown"}`, {
        code: error.code,
        message: error.message,
      });
    },
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/", (c) => c.text("OK"));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(`[Hono] ${c.req.method} ${c.req.path}`, err);
  return c.json({ error: "Internal Server Error" }, 500);
});

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down...`);
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
