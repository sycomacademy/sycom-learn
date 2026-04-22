import { Link as RouterLink, useRouter } from "@tanstack/react-router";
import type { ForesightRegisterOptions } from "js.foresight";
import type { ComponentPropsWithoutRef, Ref } from "react";
import { useCallback } from "react";

import useForesight from "@/hooks/use-foresight";

type RouterLinkProps = ComponentPropsWithoutRef<typeof RouterLink>;

type ForesightLinkProps = Omit<RouterLinkProps, "preload"> &
  Omit<ForesightRegisterOptions, "element" | "callback"> & {
    ref?: Ref<HTMLAnchorElement>;
  };

export function Link({
  hitSlop,
  meta,
  name,
  reactivateAfter,
  ref: forwardedRef,
  ...linkProps
}: ForesightLinkProps) {
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

  const setRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      elementRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [elementRef, forwardedRef],
  );

  return (
    <RouterLink
      {...linkProps}
      preload={registerResults.current?.isTouchDevice ? "intent" : false}
      ref={setRef}
    />
  );
}
