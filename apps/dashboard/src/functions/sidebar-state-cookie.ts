import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

/** Must match `SIDEBAR_COOKIE_NAME` in `@sycom/ui/components/sidebar`. */
const SIDEBAR_COOKIE_NAME = "sidebar_state";

export const getSidebarState = createServerFn({ method: "GET" }).handler(() => {
  const value = getCookie(SIDEBAR_COOKIE_NAME);
  return value === undefined ? undefined : value === "true";
});
