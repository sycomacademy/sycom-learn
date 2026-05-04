import { Image, View } from "@react-pdf/renderer";

import { BRAND } from "@sycom/ui/image/assets";
import { buildImageUrl } from "@sycom/ui/image/cdn";

const logoSrc = buildImageUrl(BRAND.LOGO_PNG);

export function BrandMark({ align = "center" }: { align?: "center" | "flex-start" }) {
  return (
    <View style={{ width: "100%", alignItems: align, marginBottom: 16 }}>
      <Image src={logoSrc} style={{ width: 112, height: 28, objectFit: "contain" }} />
    </View>
  );
}
