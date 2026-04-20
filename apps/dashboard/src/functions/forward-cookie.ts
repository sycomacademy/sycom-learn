import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getForwardedCookieHeader = createIsomorphicFn()
  .client((): Record<string, string> => ({}))
  .server((): Record<string, string> => {
    const cookie = getRequest().headers.get("cookie") ?? "";
    return cookie ? { cookie } : {};
  });
