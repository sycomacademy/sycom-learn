import { logger } from "@sycom/logger";
import type { Context, MiddlewareHandler } from "hono";

import { getRequestTrace } from "@/utils/request-trace";

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
      logger.info(`${method} ${path} ${statusCode} - completed in ${durationMs.toFixed(2)}ms`, {
        requestId,
        cfRay,
      });
    } else {
      logger.error(`${method} ${path} ${statusCode} - completed in ${durationMs.toFixed(2)}ms`, {
        requestId,
        cfRay,
      });
    }
  };
};
