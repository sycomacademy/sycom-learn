import { passkeyClient } from "@better-auth/passkey/client";
import { env } from "@sycom/env/web";
import { orgAc, orgRoles, platformAc, platformRoles } from "@sycom/auth/permissions";
import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";

// Browser hits the public ingress (the dashboard reverse-proxies /api/auth
// to localhost:3001). SSR skips the proxy hop and talks to the server
// container directly over loopback via INTERNAL_SERVER_URL.
const baseURL =
  typeof window === "undefined"
    ? (process.env.INTERNAL_SERVER_URL ?? env.VITE_SERVER_URL)
    : env.VITE_SERVER_URL;

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    passkeyClient(),
    lastLoginMethodClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== "undefined") {
          window.location.href = "/two-factor";
        }
      },
    }),
    organizationClient({
      ac: orgAc,
      roles: orgRoles,
      teams: { enabled: true },
    }),
    adminClient({
      ac: platformAc,
      roles: platformRoles,
    }),
    dashClient(),
  ],
});
