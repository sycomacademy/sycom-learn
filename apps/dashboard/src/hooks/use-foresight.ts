import { ForesightManager, type ForesightRegisterOptionsWithoutElement } from "js.foresight";
import { useEffect, useRef } from "react";

export default function useForesight<T extends HTMLElement = HTMLElement>(
  options: ForesightRegisterOptionsWithoutElement,
) {
  const elementRef = useRef<T>(null);
  const registerResults = useRef<ReturnType<typeof ForesightManager.instance.register> | null>(
    null,
  );

  useEffect(() => {
    if (!elementRef.current) return;

    registerResults.current = ForesightManager.instance.register({
      element: elementRef.current,
      ...options,
    });
  }, [options]);

  return { elementRef, registerResults };
}
