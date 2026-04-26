"use client";

import QRCodeGenerator from "qrcode";
import { type HTMLAttributes, useEffect, useState } from "react";

import { cn } from "../lib/utils";

export type QRCodeProps = HTMLAttributes<HTMLDivElement> & {
  data: string;
  foreground?: string;
  background?: string;
  robustness?: "L" | "M" | "Q" | "H";
};

function resolveThemeColor(propertyName: "--foreground" | "--background") {
  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(propertyName).trim();

  return value || (propertyName === "--foreground" ? "oklch(0.141 0.005 285.823)" : "oklch(1 0 0)");
}

export function QRCode({
  data,
  foreground,
  background,
  robustness = "M",
  className,
  ...props
}: QRCodeProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderQrCode = async () => {
      try {
        const nextSvg = await QRCodeGenerator.toString(data, {
          type: "svg",
          width: 200,
          margin: 0,
          errorCorrectionLevel: robustness,
          color: {
            dark: foreground ?? resolveThemeColor("--foreground"),
            light: background ?? resolveThemeColor("--background"),
          },
        });

        if (!cancelled) {
          setSvg(nextSvg);
        }
      } catch {
        if (!cancelled) {
          setSvg(null);
        }
      }
    };

    void renderQrCode();

    return () => {
      cancelled = true;
    };
  }, [background, data, foreground, robustness]);

  if (!svg) {
    return null;
  }

  return (
    <div
      className={cn("size-full [&_svg]:size-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...props}
    />
  );
}
