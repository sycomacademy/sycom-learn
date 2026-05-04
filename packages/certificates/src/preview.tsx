import { PDFViewer } from "@react-pdf/renderer";

import { certificateTemplates, type CertificateTemplateId } from "./registry";
import type { CertificatePdfPayload } from "./types";

export function CertificatePreview({
  templateId,
  payload,
  className,
}: {
  templateId: CertificateTemplateId;
  payload: CertificatePdfPayload;
  className?: string;
}) {
  const Template = certificateTemplates[templateId];
  return (
    <PDFViewer
      showToolbar={false}
      style={{ border: "none", width: "100%", height: "100%" }}
      className={className}
    >
      <Template {...payload} />
    </PDFViewer>
  );
}
