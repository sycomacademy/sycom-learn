import { buttonVariants } from "@sycom/ui/components/button-variants";
import { createFileRoute } from "@tanstack/react-router";

import { Link } from "@/components/foresight-link";

export const Route = createFileRoute("/_auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password | Sycom LMS" },
      {
        name: "description",
        content: "Reset your Sycom account password.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="w-full space-y-4 text-center">
      <h1 className="text-lg font-medium tracking-tight">Reset password</h1>
      <p className="text-sm text-muted-foreground">
        Password reset isn&apos;t set up yet. Please contact support or try signing in again.
      </p>
      <div className="flex flex-col gap-2">
        <Link className={buttonVariants({ variant: "outline" })} to="/sign-in">
          Back to sign in
        </Link>
        <Link className={buttonVariants({ className: "px-0", variant: "link" })} to="/sign-up">
          Create account
        </Link>
      </div>
    </div>
  );
}
