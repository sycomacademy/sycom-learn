import { Link, useRouter } from "@tanstack/react-router";
import type { ForesightRegisterOptions } from "js.foresight";
import type { ComponentPropsWithoutRef } from "react";

import useForesight from "@/hooks/use-foresight";

type RouterLinkProps = ComponentPropsWithoutRef<typeof Link>;

type ForesightLinkProps = Omit<RouterLinkProps, "preload"> &
  Omit<ForesightRegisterOptions, "element" | "callback">;

export function ForesightLink({
  hitSlop,
  meta,
  name,
  reactivateAfter,
  ...linkProps
}: ForesightLinkProps) {
  const router = useRouter();
  const { elementRef, registerResults } = useForesight<HTMLAnchorElement>({
    callback: () => {
      void router.preloadRoute({
        from: (linkProps as { from?: string }).from,
        hash: (linkProps as { hash?: string }).hash,
        params: (linkProps as { params?: unknown }).params,
        search: (linkProps as { search?: unknown }).search,
        to: (linkProps as { to: string }).to,
      });
    },
    hitSlop,
    meta,
    name,
    reactivateAfter,
  });

  return (
    <Link
      {...linkProps}
      preload={registerResults.current?.isTouchDevice ? "intent" : false}
      ref={elementRef}
    />
  );
}
