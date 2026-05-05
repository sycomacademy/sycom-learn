export type OrgAccentPreset = { hex: string; label: string };

/** Kept aligned with `@sycom/ui` primary hue; extras are saturated alternatives. */
export const ORG_BRAND_PRIMARY_HEX = "#4f46e5" as const;

export const ORG_ACCENT_PRESETS: readonly OrgAccentPreset[] = [
  { hex: ORG_BRAND_PRIMARY_HEX, label: "Sycom" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#059669", label: "Emerald" },
  { hex: "#d97706", label: "Amber" },
  { hex: "#e11d48", label: "Rose" },
] as const;
