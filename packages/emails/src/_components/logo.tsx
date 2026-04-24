import { Img, Section } from "@react-email/components";
import { BRAND } from "@sycom/ui/image/assets";
import { buildImageUrl } from "@sycom/ui/image/cdn";

export function Logo() {
  return (
    <Section>
      <Img
        alt="Sycom Solutions"
        className="mx-auto my-0 block"
        src={buildImageUrl(BRAND.LOGO)}
        width="146"
      />
    </Section>
  );
}
