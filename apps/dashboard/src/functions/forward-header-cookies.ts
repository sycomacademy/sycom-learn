import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

/**
 * Get the forwarded cookie header from the request headers.
 * Client-side returns an empty object since we use include credentials in the fetch options.
 * Server-side returns the cookie header from the request headers.
 * @returns The forwarded cookie header.
 */
export const getForwardedCookieHeader = createIsomorphicFn()
  .client((): Record<string, string> => ({}))
  .server((): Record<string, string> => {
    const cookie = getRequestHeaders().get("cookie") ?? "";
    return cookie ? { cookie } : {};
  });
