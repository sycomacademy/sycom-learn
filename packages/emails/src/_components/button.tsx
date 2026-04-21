import { Button as EmailButton } from "@react-email/components";
import type React from "react";
import { colors } from "./theme";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton
      className="box-border px-6 py-3 text-center text-sm font-medium no-underline"
      href={href}
      style={{
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
      }}
    >
      {children}
    </EmailButton>
  );
}
