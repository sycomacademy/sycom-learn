import { Hr, Link, Section, Text } from "@react-email/components";
import { getWebsiteUrl } from "./urls";
import { colors } from "./theme";

const baseUrl = getWebsiteUrl();

export function Footer() {
  return (
    <Section>
      <Hr className="mt-8 mb-4 border-t border-solid" style={{ borderTopColor: colors.border }} />
      <Text className="m-0 text-center text-xs" style={{ color: colors.muted }}>
        &copy; {new Date().getFullYear()} Sycom Solutions. All rights reserved.
      </Text>
      <Text className="m-0 mt-1 text-center text-xs" style={{ color: colors.muted }}>
        <Link className="underline" href={`${baseUrl}/privacy`} style={{ color: colors.muted }}>
          Privacy Policy
        </Link>
        {" · "}
        <Link className="underline" href={`${baseUrl}/terms`} style={{ color: colors.muted }}>
          Terms of Service
        </Link>
        {" · "}
        <Link className="underline" href={baseUrl} style={{ color: colors.muted }}>
          Sycom
        </Link>
      </Text>
    </Section>
  );
}
