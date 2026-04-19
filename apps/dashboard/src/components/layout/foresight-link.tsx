import { Link as RouterLink, useRouter } from "@tanstack/react-router";
import type { ForesightRegisterOptions } from "js.foresight";
import type { ComponentPropsWithoutRef } from "react";

import useForesight from "@/hooks/use-foresight";

type RouterLinkProps = ComponentPropsWithoutRef<typeof RouterLink>;

type ForesightLinkProps = Omit<RouterLinkProps, "preload"> &
  Omit<ForesightRegisterOptions, "element" | "callback">;

export function Link({ hitSlop, meta, name, reactivateAfter, ...linkProps }: ForesightLinkProps) {
  const router = useRouter();
  const { elementRef, registerResults } = useForesight<HTMLAnchorElement>({
    callback: () => {
      const preloadOptions: Parameters<typeof router.preloadRoute>[0] = {
        hash: linkProps.hash,
        params: linkProps.params,
        search: linkProps.search,
        to: linkProps.to,
      };

      void router.preloadRoute(preloadOptions);
    },
    hitSlop,
    meta,
    name,
    reactivateAfter,
  });

  return (
    <RouterLink
      {...linkProps}
      preload={registerResults.current?.isTouchDevice ? "intent" : false}
      ref={elementRef}
    />
  );
}
