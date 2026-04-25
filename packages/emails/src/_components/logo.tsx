import { Img, Section } from "@react-email/components";
import { BRAND } from "@sycom/ui/image/assets";
import { buildImageUrl } from "@sycom/ui/image/cdn";

export function Logo() {
  return (
    <Section>
      <Img
        alt="Sycom Solutions"
        className="mx-auto my-0 block size-10 object-contain"
        src={buildImageUrl(BRAND.LOGO_ICON)}
        width="40"
      />
    </Section>
  );
}
