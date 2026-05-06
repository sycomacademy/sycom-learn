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

// Container Apps in the same environment must call each other via the
// internal FQDN; the public FQDN hairpins through Envoy and hangs.
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
