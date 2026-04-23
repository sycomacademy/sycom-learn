import { describe, expect, test } from "bun:test";
import type { AnyRouter } from "@tanstack/react-router";

import { resolvePostAuthRedirect, safeRedirectPath } from "./auth-redirect";

describe("safeRedirectPath", () => {
  const cases: Array<[string | undefined, string | null]> = [
    [undefined, null],
    ["", null],
    ["//evil.com", null],
    ["///evil.com", null],
    ["/\\evil.com", "/\\evil.com"], // intentionally allowed — it's a path, not a protocol-relative URL
    ["https://evil.com/x", null],
    ["http://evil.com", null],
    ["javascript:alert(1)", null],
    ["/dashboard", "/dashboard"],
    ["/dashboard/courses?tab=1", "/dashboard/courses?tab=1"],
    ["/a/b/c#frag", "/a/b/c#frag"],
  ];

  test.each(cases)(
    "safeRedirectPath(%p) === %p",
    (input: string | undefined, expected: string | null) => {
      expect(safeRedirectPath(input)).toBe(expected);
    },
  );
});

// Minimal fake router that satisfies the narrow slice of AnyRouter the
// redirect helper uses (just `getMatchedRoutes`).
const routerWhere = (match: (pathname: string) => string | null) =>
  ({
    getMatchedRoutes: (pathname: string) => {
      const id = match(pathname);
      return id ? { foundRoute: { id } } : { foundRoute: undefined };
    },
  }) as unknown as AnyRouter;

describe("resolvePostAuthRedirect", () => {
  test("falls back to /dashboard when the redirect is unsafe", () => {
    expect(
      resolvePostAuthRedirect(
        routerWhere(() => "/whatever"),
        "//evil.com",
      ),
    ).toBe("/dashboard");
    expect(
      resolvePostAuthRedirect(
        routerWhere(() => "/whatever"),
        "https://evil.com",
      ),
    ).toBe("/dashboard");
    expect(
      resolvePostAuthRedirect(
        routerWhere(() => "/whatever"),
        undefined,
      ),
    ).toBe("/dashboard");
  });

  test("falls back when the router has no matching route", () => {
    expect(
      resolvePostAuthRedirect(
        routerWhere(() => null),
        "/bogus",
      ),
    ).toBe("/dashboard");
  });

  test("collapses the catch-all /$ route to fallback", () => {
    expect(
      resolvePostAuthRedirect(
        routerWhere(() => "/$"),
        "/does-not-exist",
      ),
    ).toBe("/dashboard");
  });

  test("returns the safe path when the router has a real matching route", () => {
    const router = routerWhere((pathname) =>
      pathname === "/dashboard/courses" ? "/dashboard/courses" : null,
    );
    expect(resolvePostAuthRedirect(router, "/dashboard/courses")).toBe("/dashboard/courses");
  });

  test("preserves query strings on safe matching paths", () => {
    const router = routerWhere((pathname) =>
      pathname === "/dashboard/courses" ? "/dashboard/courses" : null,
    );
    expect(resolvePostAuthRedirect(router, "/dashboard/courses?tab=1")).toBe(
      "/dashboard/courses?tab=1",
    );
  });
});
