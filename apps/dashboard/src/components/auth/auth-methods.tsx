import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@sycom/ui/components/accordion";
import { GoogleLogo } from "@sycom/ui/components/logos/google";
import { LinkedinLogo } from "@sycom/ui/components/logos/linkedin";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@sycom/ui/components/tooltip";
import { cn } from "@sycom/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";
import { FingerprintIcon } from "lucide-react";
import type React from "react";

type AuthMethodsProps = {
  lastUsedMethod?: string | null;
  linkedInLoading?: boolean;
  onLinkedIn?: () => void;
  onGoogle?: () => void;
  onPasskey?: () => void;
  passkeyLoading?: boolean;
  socialDisabledReason?: string;
  showPasskey?: boolean;
  title: string;
};

export function AuthMethods({
  lastUsedMethod,
  linkedInLoading = false,
  onLinkedIn,
  onGoogle,
  onPasskey,
  passkeyLoading = false,
  socialDisabledReason = "Not yet available",
  showPasskey = false,
  title,
}: AuthMethodsProps) {
  const { pathname } = useLocation();
  const isSignUpPath = pathname === "/sign-up";
  const shouldOpenByDefault =
    !isSignUpPath &&
    (lastUsedMethod === "passkey" || lastUsedMethod === "google" || lastUsedMethod === "linkedin");

  return (
    <Accordion
      className="w-full"
      defaultValue={shouldOpenByDefault ? ["methods"] : []}
      key={`${pathname}:${lastUsedMethod ?? "none"}`}
    >
      <AccordionItem value="methods">
        <AccordionTrigger className="py-2 text-sm font-medium">{title}</AccordionTrigger>
        <AccordionContent className="space-y-3 overflow-visible px-1 pt-3 pb-1">
          {showPasskey ? (
            <AuthMethodButton
              icon={<FingerprintIcon className="size-4" />}
              isLastUsed={lastUsedMethod === "passkey"}
              loading={passkeyLoading}
              onClick={onPasskey}
            >
              Continue with passkey
            </AuthMethodButton>
          ) : null}

          <SocialAuthMethodButton
            disabledReason={socialDisabledReason}
            icon={<GoogleLogo className="size-4" />}
            isLastUsed={lastUsedMethod === "google"}
            onClick={onGoogle}
          >
            Continue with Google
          </SocialAuthMethodButton>

          <SocialAuthMethodButton
            disabledReason={socialDisabledReason}
            icon={<LinkedinLogo className="size-4" />}
            isLastUsed={lastUsedMethod === "linkedin"}
            loading={linkedInLoading}
            onClick={onLinkedIn}
          >
            Continue with LinkedIn
          </SocialAuthMethodButton>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AuthMethodButton({
  children,
  className,
  icon,
  isLastUsed = false,
  loading = false,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  isLastUsed?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="relative w-full pt-1">
      <Button
        className={cn("w-full", className)}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        type="button"
        variant="outline"
      >
        <span className="flex items-center gap-3">
          {icon}
          <span>{children}</span>
        </span>
      </Button>
      {isLastUsed ? (
        <Badge className="pointer-events-none absolute top-0 -right-1 rounded-none px-2" size="sm">
          Last used
        </Badge>
      ) : null}
    </div>
  );
}

function SocialAuthMethodButton({
  children,
  disabledReason,
  icon,
  isLastUsed = false,
  loading = false,
  onClick,
}: {
  children: React.ReactNode;
  disabledReason: string;
  icon: React.ReactNode;
  isLastUsed?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <AuthMethodButton icon={icon} isLastUsed={isLastUsed} loading={loading} onClick={onClick}>
        {children}
      </AuthMethodButton>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          (
            <div className="w-full cursor-not-allowed">
              <AuthMethodButton disabled icon={icon} isLastUsed={isLastUsed}>
                {children}
              </AuthMethodButton>
            </div>
          ) as React.ReactElement<Record<string, unknown>>
        }
      />
      <TooltipPopup>{disabledReason}</TooltipPopup>
    </Tooltip>
  );
}
