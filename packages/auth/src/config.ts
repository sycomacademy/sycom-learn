import { env } from "@sycom/env/server";
import { APIError } from "better-auth";
import { createLoggerWithContext } from "@sycom/logger";

const authLogger = createLoggerWithContext("auth");

// Email stubs — replace with a real provider (Resend/Postmark/SES) before
// shipping. In dev, they log the URL so you can copy/paste it. In prod, they
// throw loudly so signups fail visibly instead of silently skipping
// verification.
export const devOrThrow = (label: string, to: string, url: string) => {
  if (env.NODE_ENV === "production") {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: `Email provider not configured (${label}). Configure one before enabling in production.`,
    });
  }
  console.log(`[auth:${label}] to=${to} url=${url}`);
};

export const betterAuthLogger = env.DEBUG_PERFORMANCE
  ? {
      logger: {
        level: "debug" as const,
        log: (level: "debug" | "info" | "warn" | "error", message: string, ...args: unknown[]) => {
          const logMessage = `[better-auth:${level}] ${message}`;
          const logData = args.length > 0 ? { args } : undefined;

          if (level === "debug") {
            authLogger.debug(logMessage, logData);
            return;
          }

          if (level === "info") {
            authLogger.info(logMessage, logData);
            return;
          }

          if (level === "warn") {
            authLogger.warn(logMessage, logData);
            return;
          }

          authLogger.error(logMessage, logData);
        },
      },
    }
  : {};
