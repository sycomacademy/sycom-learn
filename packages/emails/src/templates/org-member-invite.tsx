import { Body, Container, Heading, Preview, Section, Text } from "@react-email/components";
import { Button } from "../_components/button";
import { Footer } from "../_components/footer";
import { Logo } from "../_components/logo";
import { colors, EmailThemeProvider } from "../_components/theme";

type OrgMemberInviteRole = "admin" | "teacher" | "student";

const ROLE_LABELS: Record<OrgMemberInviteRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

export type OrgMemberInviteEmailProps = {
  inviteUrl: string;
  inviterName: string;
  name: string;
  organizationName: string;
  role: OrgMemberInviteRole;
};

export function OrgMemberInviteEmail({
  inviteUrl = "https://example.com/accept-invite?kind=organization-member&token=abc",
  inviterName = "Jane Smith",
  name = "Alex Doe",
  organizationName = "Acme Learning",
  role = "student",
}: OrgMemberInviteEmailProps) {
  const roleLabel = ROLE_LABELS[role] ?? "Member";

  return (
    <EmailThemeProvider
      preview={
        <Preview>
          {inviterName} invited you to join {organizationName} on Sycom LMS
        </Preview>
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
            You&apos;re invited to {organizationName}
          </Heading>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            Hi {name},
          </Text>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            <strong>{inviterName}</strong> invited you to join <strong>{organizationName}</strong>{" "}
            on Sycom LMS as a <strong>{roleLabel}</strong>.
          </Text>

          <Text className="text-sm leading-6" style={{ color: colors.foreground }}>
            Click the button below to set your password and create your account.
          </Text>

          <Section className="mt-8 mb-8 text-center">
            <Button href={inviteUrl}>Accept invite</Button>
          </Section>

          <Text className="text-xs" style={{ color: colors.muted }}>
            This invite is valid for 24 hours. If you were not expecting it, you can safely ignore
            this email.
          </Text>

          <Text className="text-xs" style={{ color: colors.muted }}>
            If the button above doesn&apos;t work, copy and paste this link into your browser:
          </Text>
          <code className="block text-xs break-all" style={{ color: colors.primary }}>
            {inviteUrl}
          </code>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
}

export default OrgMemberInviteEmail;
OrgMemberInviteEmail.PreviewProps = {
  inviteUrl: "https://example.com/accept-invite?kind=organization-member&token=abc123",
  inviterName: "Jane Smith",
  name: "Alex Doe",
  organizationName: "Acme Learning",
  role: "student",
} as OrgMemberInviteEmailProps;
