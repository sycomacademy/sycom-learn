import { renderToBuffer } from "@react-pdf/renderer";

import { certificateTemplates, type CertificateTemplateId } from "./registry";
import type { CertificatePdfPayload } from "./types";

/** Renders the selected preset template to a PDF suitable for email attachment. Server-only. */
export async function renderCertificatePdf(
  templateId: CertificateTemplateId,
  payload: CertificatePdfPayload,
): Promise<Buffer> {
  const Template = certificateTemplates[templateId];
  const element = <Template {...payload} />;
  return renderToBuffer(element);
}
