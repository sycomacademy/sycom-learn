import type { TailwindConfig } from "@react-email/components";
import { Font, Head, Html, pixelBasedPreset, Tailwind } from "@react-email/components";
import type React from "react";

/**
 * Email theme tokens — hex equivalents of the oklch design tokens in globals.css.
 *
 *   --primary:            oklch(0.2495 0.1148 261.94)  -> #1a1a6e
 *   --primary-foreground: oklch(0.97 0.014 254.604)    -> #f5f5ff
 *   --foreground:         oklch(0.141 0.005 285.823)   -> #1c1c1e
 *   --muted-foreground:   oklch(0.552 0.016 285.938)   -> #838386
 *   --border:             oklch(0.92 0.004 286.32)     -> #e8e8e6
 *   --background:         oklch(1 0 0)                 -> #ffffff
 *   --radius:             0
 */
export const colors = {
  background: "#ffffff",
  surface: "#fafafa",
  foreground: "#1c1c1e",
  muted: "#838386",
  border: "#e8e8e6",
  primary: "#1a1a6e",
  primaryForeground: "#f5f5ff",
} as const;

const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Work Sans", "system-ui", "Arial", "sans-serif"],
      },
    },
  },
} satisfies TailwindConfig;

interface EmailThemeProviderProps {
  children: React.ReactNode;
  preview?: React.ReactNode;
}

export function EmailThemeProvider({ children, preview }: EmailThemeProviderProps) {
  return (
    <Html lang="en">
      <Tailwind config={tailwindConfig}>
        <Head>
          <meta content="light" name="color-scheme" />
          <Font
            fallbackFontFamily={["Arial", "Helvetica"]}
            fontFamily="Work Sans"
            fontStyle="normal"
            fontWeight={400}
            webFont={{
              url: "https://fonts.gstatic.com/s/worksans/v19/QGYsz_wNahGAdqQ43Rh_fKDp.woff2",
              format: "woff2",
            }}
          />
        </Head>
        {preview}
        {children}
      </Tailwind>
    </Html>
  );
}
