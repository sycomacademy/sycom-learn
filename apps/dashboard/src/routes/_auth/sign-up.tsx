import { env } from "@sycom/env/web";
import { createFileRoute } from "@tanstack/react-router";

import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/_auth/sign-up")({
  head: () => ({
    meta: [
      {
        title: "Create account | Sycom LMS",
      },
      {
        name: "description",
        content: "Create your Sycom account to get started.",
      },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full items-center justify-center">
        <SignUpForm />
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <a
            className="underline underline-offset-4 transition-colors hover:text-foreground"
            href={`${env.VITE_WEBSITE_URL}/terms`}
          >
            Terms of Service
          </a>{" "}
          &amp;{" "}
          <a
            className="underline underline-offset-4 transition-colors hover:text-foreground"
            href={`${env.VITE_WEBSITE_URL}/privacy`}
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
