import { env } from "@sycom/env/web";
import { orgAc, orgRoles, platformAc, platformRoles } from "@sycom/auth/permissions";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [
    organizationClient({
      ac: orgAc,
      roles: orgRoles,
      teams: { enabled: true },
    }),
    adminClient({
      ac: platformAc,
      roles: platformRoles,
    }),
  ],
});
