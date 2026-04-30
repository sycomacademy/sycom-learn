export interface ShortcutModifiers {
  readonly alt?: boolean;
  readonly ctrl?: boolean;
  readonly meta?: boolean;
  readonly mod?: boolean;
  readonly shift?: boolean;
}

export interface ShortcutDefinition {
  readonly description: string;
  readonly key: string;
  readonly modifiers: ShortcutModifiers;
  readonly scope: "global";
}

export const shortcuts = {
  SIDEBAR_TOGGLE: {
    description: "Toggle sidebar",
    key: "b",
    modifiers: { mod: true },
    scope: "global",
  },
  TOGGLE_THEME: {
    description: "Toggle theme",
    key: "l",
    modifiers: { mod: true, shift: true },
    scope: "global",
  },
  SIGN_OUT: {
    description: "Sign out",
    key: "q",
    modifiers: { ctrl: true, alt: true },
    scope: "global",
  },
} as const satisfies Record<string, ShortcutDefinition>;

export type ShortcutId = keyof typeof shortcuts;

export const shortcutIds = Object.fromEntries(
  (Object.keys(shortcuts) as ShortcutId[]).map((id) => [id, id]),
) as {
  readonly [K in ShortcutId]: K;
};
