import { SIDEBAR_COOKIE_NAME } from "@sycom/ui/components/sidebar";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export const getSidebarState = createServerFn({ method: "GET" }).handler(() => {
  const value = getCookie(SIDEBAR_COOKIE_NAME);
  return value === undefined ? undefined : value === "true";
});
