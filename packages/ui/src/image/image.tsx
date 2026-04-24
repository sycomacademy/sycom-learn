import { Image as UnpicImage } from "@unpic/react";
import type { ComponentProps } from "react";
import { buildImageUrl } from "./cdn";

/** Same prop surface as @unpic/react's Image. `src` is a Cloudinary public ID or absolute URL. */
export type ImageProps = ComponentProps<typeof UnpicImage>;

export function Image(props: ImageProps) {
  return <UnpicImage {...props} src={buildImageUrl(props.src)} />;
}
