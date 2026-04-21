import { Img, Section } from "@react-email/components";
import { getWebsiteUrl } from "./urls";

const baseUrl = getWebsiteUrl();

export function Logo() {
  return (
    <Section>
      <Img
        alt="Sycom Solutions"
        className="mx-auto my-0 block"
        src={`${baseUrl}/sycom-logo.png`}
        width="146"
      />
    </Section>
  );
}
