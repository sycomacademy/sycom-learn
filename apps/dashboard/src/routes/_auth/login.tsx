import { env } from "@sycom/env/web";
import { createFileRoute } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({
    meta: [
      {
        title: "Sign In | Sycom LMS",
      },
      {
        name: "description",
        content: "Sign in to your Sycom account or create a new one.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full items-center justify-center">
        <SignInForm />
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By signing in you agree to our{" "}
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
