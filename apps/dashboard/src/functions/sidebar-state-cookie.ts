import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/** Must match `SIDEBAR_COOKIE_NAME` in `@sycom/ui/components/sidebar`. */
const SIDEBAR_COOKIE_NAME = "sidebar_state";

function parseSidebarOpen(cookieHeader: string): boolean | undefined {
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq);
    const value = decodeURIComponent(trimmed.slice(eq + 1));
    if (name === SIDEBAR_COOKIE_NAME) {
      return value === "true";
    }
  }
  return undefined;
}

/**
 * Reads `sidebar_state` from the current request (SSR) or `document.cookie` (client navigations).
 * Use from route loaders so `SidebarProvider` can match persisted state on first paint.
 */
export const getSidebarStateFromCookie = createIsomorphicFn()
  .server((): boolean | undefined => {
    const cookie = getRequest().headers.get("cookie") ?? "";
    return parseSidebarOpen(cookie);
  })
  .client((): boolean | undefined => {
    if (typeof document === "undefined") return undefined;
    return parseSidebarOpen(document.cookie);
  });
