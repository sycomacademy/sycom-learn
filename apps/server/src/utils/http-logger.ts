import { createLoggerWithContext } from "@sycom/logger";
import type { Context, MiddlewareHandler } from "hono";

import { getRequestTrace } from "@/utils/request-trace";

const httpMiddlewareLogger = createLoggerWithContext("http");

export const httpLogger = (): MiddlewareHandler => {
  return async (context: Context, next) => {
    const start = process.hrtime.bigint();

    const method = context.req.method;
    const path = new URL(context.req.url).pathname;
    const { requestId, cfRay } = getRequestTrace(context.req);

    await next();

    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const statusCode = context.res.status;
    const isResponseOk = context.res.ok;

    if (isResponseOk) {
      httpMiddlewareLogger.info(
        `${method} ${path} ${statusCode} - completed in ${durationMs.toFixed(2)}ms`,
        {
          requestId,
          cfRay,
        },
      );
    } else {
      httpMiddlewareLogger.error(
        `${method} ${path} ${statusCode} - completed in ${durationMs.toFixed(2)}ms`,
        {
          requestId,
          cfRay,
        },
      );
    }
  };
};
