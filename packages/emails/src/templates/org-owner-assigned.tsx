import { Body, Container, Heading, Preview, Section, Text } from "@react-email/components";
import { Button } from "../_components/button";
import { Footer } from "../_components/footer";
import { Logo } from "../_components/logo";
import { colors, EmailThemeProvider } from "../_components/theme";

export type OrgOwnerInviteScenario = "new_account" | "existing_account";

interface OrgOwnerAssignedEmailProps {
  organizationName: string;
  inviterName: string;
  inviteeName: string;
  ctaUrl: string;
  scenario: OrgOwnerInviteScenario;
}

export function OrgOwnerAssignedEmail({
  organizationName = "Example Academy",
  inviterName = "Jane Admin",
  inviteeName = "Alex Owner",
  ctaUrl = "https://example.com/dashboard/organisation/setup",
  scenario = "existing_account",
}: OrgOwnerAssignedEmailProps) {
  const isNewAccount = scenario === "new_account";

  return (
    <EmailThemeProvider
      preview={
        <Preview>You&apos;ve been assigned owner of {organizationName} on Sycom LMS</Preview>
      }
    >
      <Body
        className="mx-auto my-auto font-sans"
        style={{ backgroundColor: colors.surface, color: colors.foreground }}
      >
        <Container
          className="mx-auto my-10 max-w-xl border border-solid p-5"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Logo />

          <Heading
            className="mx-0 my-8 p-0 text-center text-xl font-semibold"
            style={{ color: colors.foreground }}
          >
            You&apos;ve been assigned owner
          </Heading>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            Hi {inviteeName},
          </Text>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            <strong>{inviterName}</strong> has made you the owner of{" "}
            <strong>{organizationName}</strong> on Sycom LMS.
          </Text>

          {isNewAccount ? (
            <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
              Click the button below to set your password and finish creating your account. You can
              then continue to your organisation setup.
            </Text>
          ) : (
            <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
              Sign in with your existing account, then open your organisation setup to get started.
            </Text>
          )}

          <Section className="mt-8 mb-8 text-center">
            <Button href={ctaUrl}>
              {isNewAccount ? "Accept invite" : "Open organisation setup"}
            </Button>
          </Section>

          <Text className="text-xs" style={{ color: colors.muted }}>
            This message was sent because a platform administrator assigned you as organisation
            owner. If you were not expecting it, you can ignore this email.
          </Text>

          <Text className="text-xs" style={{ color: colors.muted }}>
            If the button above doesn&apos;t work, copy and paste this link into your browser:
          </Text>
          <code className="block text-xs break-all" style={{ color: colors.primary }}>
            {ctaUrl}
          </code>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
}

export default OrgOwnerAssignedEmail;
OrgOwnerAssignedEmail.PreviewProps = {
  organizationName: "Example Academy",
  inviterName: "Jane Admin",
  inviteeName: "Alex Owner",
  ctaUrl: "https://example.com/dashboard/organisation/setup",
  scenario: "existing_account",
} satisfies OrgOwnerAssignedEmailProps;
