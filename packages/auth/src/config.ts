import { render, ResetPasswordEmail, sendEmail, VerifyEmail } from "@sycom/emails";
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

type AuthEmailUser = {
  email: string;
  name?: string | null;
};

const sendAuthEmail = async ({
  to,
  subject,
  html,
  label,
}: {
  to: string;
  subject: string;
  html: string;
  label: string;
}) => {
  const response = await sendEmail({ to, subject, html });

  if (response.error) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: `Failed to send ${label} email.`,
    });
  }
};

export const sendResetPasswordEmail = async (user: AuthEmailUser, url: string) => {
  const html = await render(
    ResetPasswordEmail({
      name: user.name || user.email,
      resetUrl: url,
    }),
  );

  await sendAuthEmail({
    to: user.email,
    subject: "Reset your Sycom LMS password",
    html,
    label: "password reset",
  });
};

export const sendVerificationEmail = async (user: AuthEmailUser, url: string) => {
  const html = await render(
    VerifyEmail({
      name: user.name || user.email,
      verifyUrl: url,
    }),
  );

  await sendAuthEmail({
    to: user.email,
    subject: "Verify your email for Sycom LMS",
    html,
    label: "email verification",
  });
};

const logLevel = env.DEBUG_PERFORMANCE ? ("debug" as const) : ("info" as const);

export const betterAuthLogger = {
  logger: {
    level: logLevel,
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
};
