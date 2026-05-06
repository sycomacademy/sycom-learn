import {
  OrgMemberInviteEmail,
  OrgOwnerAssignedEmail,
  PlatformInviteEmail,
  render,
  ResetPasswordEmail,
  sendEmail,
  VerifyEmail,
} from "@sycom/emails";
import { env } from "@sycom/env/server";
import { APIError } from "better-auth";
import { createLoggerWithContext } from "@sycom/logger";
import type { UserRole } from "@sycom/db/schema/auth";

const authLogger = createLoggerWithContext("auth");

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

export const sendPlatformInviteEmail = async ({
  to,
  inviteUrl,
  inviterName,
  name,
  role,
}: {
  to: string;
  inviteUrl: string;
  inviterName: string;
  name: string;
  role: UserRole;
}) => {
  const html = await render(
    PlatformInviteEmail({
      inviteUrl,
      inviterName,
      name,
      role,
    }),
  );

  await sendAuthEmail({
    to,
    subject: "Your Sycom LMS invitation",
    html,
    label: "platform invite",
  });
};

export type SendOrgOwnerAssignedEmailInput = {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteeName: string;
  ctaUrl: string;
  scenario: "new_account" | "existing_account";
};

export const sendOrgOwnerAssignedEmail = async (input: SendOrgOwnerAssignedEmailInput) => {
  const html = await render(
    OrgOwnerAssignedEmail({
      organizationName: input.organizationName,
      inviterName: input.inviterName,
      inviteeName: input.inviteeName,
      ctaUrl: input.ctaUrl,
      scenario: input.scenario,
    }),
  );

  await sendAuthEmail({
    to: input.to,
    subject: `You’ve been assigned owner of ${input.organizationName}`,
    html,
    label: "org owner assigned",
  });
};

export const sendOrgMemberInviteEmail = async ({
  to,
  inviteUrl,
  inviterName,
  name,
  organizationName,
  role,
}: {
  to: string;
  inviteUrl: string;
  inviterName: string;
  name: string;
  organizationName: string;
  role: "admin" | "teacher" | "student";
}) => {
  const html = await render(
    OrgMemberInviteEmail({
      inviteUrl,
      inviterName,
      name,
      organizationName,
      role,
    }),
  );

  await sendAuthEmail({
    to,
    subject: `Invitation to join ${organizationName} on Sycom LMS`,
    html,
    label: "org member invite",
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
