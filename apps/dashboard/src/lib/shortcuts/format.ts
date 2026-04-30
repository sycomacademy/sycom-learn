import { shortcuts, type ShortcutDefinition, type ShortcutId } from "@/lib/shortcuts/definitions";

interface ResolvedModifiers {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

const MAC_SYMBOLS = {
  alt: "⌥",
  ctrl: "⌃",
  meta: "⌘",
  shift: "⇧",
} as const;

function isMacPlatform() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const platform = navigator.platform || navigator.userAgent;

  return /(mac|iphone|ipad|ipod)/i.test(platform);
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

function formatKeyLabel(key: string) {
  const normalizedKey = normalizeKey(key);

  if (normalizedKey.length === 1) {
    return normalizedKey.toUpperCase();
  }

  switch (normalizedKey) {
    case "escape":
      return "Esc";
    case "enter":
      return "Enter";
    case "tab":
      return "Tab";
    case "backspace":
      return "Backspace";
    case "delete":
      return "Delete";
    case "arrowup":
      return "Up";
    case "arrowdown":
      return "Down";
    case "arrowleft":
      return "Left";
    case "arrowright":
      return "Right";
    case " ":
    case "space":
    case "spacebar":
      return "Space";
    default:
      return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

function resolveModifiers(
  modifiers: ShortcutDefinition["modifiers"],
  isMac: boolean,
): ResolvedModifiers {
  return {
    alt: Boolean(modifiers.alt),
    ctrl: Boolean(modifiers.ctrl || (!isMac && modifiers.mod)),
    meta: Boolean(modifiers.meta || (isMac && modifiers.mod)),
    shift: Boolean(modifiers.shift),
  };
}

export function formatShortcutLabel(definition: ShortcutDefinition) {
  const isMac = isMacPlatform();
  const modifiers = resolveModifiers(definition.modifiers, isMac);
  const labels: string[] = [];

  if (isMac) {
    if (modifiers.ctrl) labels.push(MAC_SYMBOLS.ctrl);
    if (modifiers.alt) labels.push(MAC_SYMBOLS.alt);
    if (modifiers.shift) labels.push(MAC_SYMBOLS.shift);
    if (modifiers.meta) labels.push(MAC_SYMBOLS.meta);
  } else {
    if (modifiers.ctrl) labels.push("Ctrl");
    if (modifiers.alt) labels.push("Alt");
    if (modifiers.shift) labels.push("Shift");
    if (modifiers.meta) labels.push("Meta");
  }

  const keyLabel = formatKeyLabel(definition.key);

  return isMac ? `${labels.join("")}${keyLabel}` : [...labels, keyLabel].join("+");
}

export function getShortcutLabelById(id: ShortcutId) {
  return formatShortcutLabel(shortcuts[id]);
}

export function isShortcutMatch(event: KeyboardEvent, definition: ShortcutDefinition) {
  const isMac = isMacPlatform();
  const modifiers = resolveModifiers(definition.modifiers, isMac);

  if (event.ctrlKey !== modifiers.ctrl) return false;
  if (event.metaKey !== modifiers.meta) return false;
  if (event.altKey !== modifiers.alt) return false;
  if (event.shiftKey !== modifiers.shift) return false;

  const normalizedDefinitionKey = normalizeKey(definition.key);
  const normalizedEventKey = normalizeKey(event.key);
  const normalizedEventCode = normalizeKey(event.code);

  if (normalizedDefinitionKey.length === 1) {
    const keyCodeMatch =
      normalizedEventCode === `key${normalizedDefinitionKey}` ||
      normalizedEventCode === `digit${normalizedDefinitionKey}`;

    if (keyCodeMatch) {
      return true;
    }
  }

  return normalizedEventKey === normalizedDefinitionKey;
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const editableParent = target.closest("input, textarea, select, [contenteditable='true']");

  return editableParent !== null;
}
