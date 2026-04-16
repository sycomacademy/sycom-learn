import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthLeftPanel } from "./_shared/auth-left-panel";
import { SignInForm } from "./_shared/sign-in-form";

function LoginScreen() {
  return (
    <div className="flex min-h-svh bg-background p-1">
      <div className="relative hidden overflow-hidden bg-foreground lg:flex lg:w-1/2">
        <AuthLeftPanel />
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 lg:p-12">
        <div className="flex h-full w-full max-w-md flex-col">
          <div className="mb-8 flex items-center lg:hidden">
            <a className="flex items-center gap-2" href="https://example.com/">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                S
              </div>
            </a>
          </div>

          <div className="flex h-full w-full flex-col">
            <div className="flex h-full w-full items-center justify-center">
              <SignInForm />
            </div>

            <div className="mt-auto pt-6 text-center">
              <p className="text-xs text-muted-foreground">
                By signing in you agree to our{" "}
                <a
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                  href="https://example.com/terms"
                >
                  Terms of Service
                </a>{" "}
                &amp;{" "}
                <a
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                  href="https://example.com/privacy"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Screens/Login",
  component: LoginScreen,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LoginScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
