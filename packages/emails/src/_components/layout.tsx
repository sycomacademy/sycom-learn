import { Body, Container, Hr, Preview, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { Footer } from "./footer";
import { Logo } from "./logo";
import { colors, EmailThemeProvider } from "./theme";
/**
 * Shared email layout. Wraps every transactional email with a consistent
 * header (logo), content area, and footer.
 */
export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <EmailThemeProvider preview={<Preview>{preview}</Preview>}>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Logo />
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />
          <Footer />
          <Text style={footer}>Sycom Solutions &mdash; Cybersecurity Training Platform</Text>
        </Container>
      </Body>
    </EmailThemeProvider>
  );
}

/* -- Inline styles (email clients ignore CSS classes) -- */

const body: CSSProperties = {
  backgroundColor: colors.surface,
  fontFamily:
    "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const container: CSSProperties = {
  backgroundColor: colors.background,
  border: `1px solid ${colors.border}`,
  borderRadius: "0",
  margin: "40px auto",
  maxWidth: "480px",
  padding: "0",
};

const header: CSSProperties = {
  borderBottom: `1px solid ${colors.border}`,
  padding: "24px",
};

const content: CSSProperties = {
  padding: "24px",
};

const hr: CSSProperties = {
  borderColor: colors.border,
  margin: "0",
};

const footer: CSSProperties = {
  color: colors.muted,
  fontSize: "12px",
  padding: "0 24px 24px",
  textAlign: "center" as const,
};
