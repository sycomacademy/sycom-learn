import { Body, Container, Heading, Preview, Section, Text } from "@react-email/components";
import { Button } from "../_components/button";
import { Footer } from "../_components/footer";
import { Logo } from "../_components/logo";
import { colors, EmailThemeProvider } from "../_components/theme";

interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
}

export function ResetPasswordEmail({
  name = "John Doe",
  resetUrl = "https://example.com",
}: ResetPasswordEmailProps) {
  return (
    <EmailThemeProvider preview={<Preview>Reset your Sycom LMS password</Preview>}>
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
            Reset your password
          </Heading>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            Hi {name},
          </Text>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            We received a request to reset your password. Click the button below to choose a new
            one. This link is valid for 1 hour.
          </Text>

          <Section className="mt-8 mb-8 text-center">
            <Button href={resetUrl}>Reset password</Button>
          </Section>

          <Text className="text-xs" style={{ color: colors.muted }}>
            If you didn't request a password reset, you can safely ignore this email. Your password
            will remain unchanged.
          </Text>

          <Text className="text-xs" style={{ color: colors.muted }}>
            If the button above doesn't work, copy and paste this link into your browser:
          </Text>
          <code className="block text-xs break-all" style={{ color: colors.primary }}>
            {resetUrl}
          </code>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
}

export default ResetPasswordEmail;
ResetPasswordEmail.PreviewProps = {
  name: "John Doe",
  resetUrl: "https://example.com/reset?token=abc123",
} as ResetPasswordEmailProps;
