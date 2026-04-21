import { Body, Container, Heading, Preview, Section, Text } from "@react-email/components";
import { Button } from "../_components/button";
import { Footer } from "../_components/footer";
import { Logo } from "../_components/logo";
import { colors, EmailThemeProvider } from "../_components/theme";

interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
}

export function VerifyEmail({
  name = "John Doe",
  verifyUrl = "https://example.com",
}: VerifyEmailProps) {
  return (
    <EmailThemeProvider preview={<Preview>Verify your email for Sycom LMS</Preview>}>
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
            Verify your email
          </Heading>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            Hi {name},
          </Text>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            Welcome to Sycom LMS! Please verify your email address by clicking the button below.
            This link is valid for 1 hour.
          </Text>

          <Section className="mt-8 mb-8 text-center">
            <Button href={verifyUrl}>Verify email address</Button>
          </Section>

          <Text className="text-xs" style={{ color: colors.muted }}>
            If you didn't create a Sycom account, you can safely ignore this email.
          </Text>

          <Text className="text-xs" style={{ color: colors.muted }}>
            If the button above doesn't work, copy and paste this link into your browser:
          </Text>
          <code className="block text-xs break-all" style={{ color: colors.primary }}>
            {verifyUrl}
          </code>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
}

export default VerifyEmail;
VerifyEmail.PreviewProps = {
  name: "John Doe",
  verifyUrl: "https://example.com/verify?token=abc123",
} as VerifyEmailProps;
