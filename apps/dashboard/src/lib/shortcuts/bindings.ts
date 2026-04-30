import type { ShortcutId } from "@/lib/shortcuts/definitions";
import type { GlobalShortcutHandlers } from "@/hooks/use-global-shortcuts";

export function createShortcutBindings<
  T extends Partial<Record<ShortcutId, (() => void) | undefined>>,
>(bindings: T) {
  return bindings satisfies GlobalShortcutHandlers;
}
