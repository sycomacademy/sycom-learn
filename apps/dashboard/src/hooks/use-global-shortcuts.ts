import * as React from "react";
import { shortcuts, type ShortcutId } from "@/lib/shortcuts/definitions";
import { isEditableTarget, isShortcutMatch } from "@/lib/shortcuts/format";

export type GlobalShortcutHandlers = Partial<Record<ShortcutId, (() => void) | undefined>>;

export function useGlobalShortcuts(handlers: GlobalShortcutHandlers) {
  const handlersRef = React.useRef(handlers);

  React.useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      for (const [id, handler] of Object.entries(handlersRef.current) as Array<
        [ShortcutId, GlobalShortcutHandlers[ShortcutId]]
      >) {
        if (!handler) {
          continue;
        }

        const definition = shortcuts[id];

        if (!isShortcutMatch(event, definition)) {
          continue;
        }

        event.preventDefault();
        handler();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
