import { createAuthClient } from "better-auth/react";

/**
 * Same-origin `/api/auth/*` via Vite dev proxy. For SSR, use an absolute origin because
 * there is no `window` (see Better Auth fetch from Node during document render).
 */
function getBaseURL(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return "http://localhost:3001";
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});
