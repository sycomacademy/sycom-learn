import { env } from "@sycom/env/web";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { MailCheckIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { Link } from "@/components/layout/foresight-link";
import { authClient } from "@/lib/auth-client";

const RESEND_COOLDOWN_SECONDS = 60;

const checkEmailSearchSchema = z.object({
  email: z.email().optional(),
  flow: z.enum(["verify", "reset"]).optional(),
});

export const Route = createFileRoute("/_auth/check-email")({
  validateSearch: checkEmailSearchSchema,
  head: () => ({
    meta: [
      { title: "Check your email | Sycom LMS" },
      {
        name: "description",
        content: "Check your email to continue with your Sycom account.",
      },
    ],
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const { email, flow = "verify" } = useSearch({ from: "/_auth/check-email" });
  const isReset = flow === "reset";
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    try {
      const { error } = isReset
        ? await authClient.requestPasswordReset({
            email,
            redirectTo: `${env.VITE_DASHBOARD_URL}/reset-password`,
          })
        : await authClient.sendVerificationEmail({
            email,
            callbackURL: `${env.VITE_DASHBOARD_URL}/dashboard`,
          });
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      toastManager.add({
        title: isReset ? "Reset email sent" : "Verification email sent",
        type: "success",
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      toastManager.add({
        title: "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setResending(false);
    }
  };

  const subcopy = isReset
    ? "If an account exists for that email, we sent a reset link. Click it to choose a new password."
    : email
      ? undefined
      : "We sent a verification link to your email. Click it to finish setting up your account.";

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full space-y-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <MailCheckIcon className="size-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-medium tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              {subcopy ?? (
                <>
                  We sent a verification link to{" "}
                  <span className="font-medium text-foreground">{email}</span>. Click the link to
                  finish setting up your account.
                </>
              )}
            </p>
          </div>

          {email ? (
            <div className="flex flex-col gap-2">
              <Button
                disabled={cooldown > 0 || resending}
                loading={resending}
                onClick={handleResend}
                size="lg"
                variant="outline"
              >
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : isReset
                    ? "Resend reset email"
                    : "Resend verification email"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Wrong email?{" "}
                <Link
                  className={cn(buttonVariants({ variant: "link" }), "px-0")}
                  to={isReset ? "/forgot-password" : "/sign-up"}
                >
                  {isReset ? "Try a different address" : "Use a different address"}
                </Link>
              </p>
            </div>
          ) : (
            <Link
              className={buttonVariants({ variant: "outline" })}
              to={isReset ? "/forgot-password" : "/sign-up"}
            >
              {isReset ? "Back to reset" : "Back to sign up"}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          {isReset ? "Remembered your password? " : "Already verified? "}
          <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
