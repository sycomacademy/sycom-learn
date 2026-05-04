export {
  CERTIFICATE_TEMPLATE_IDS,
  certificateTemplateDescriptions,
  certificateTemplateLabels,
  type CertificateTemplateId,
  isCertificateTemplateId,
} from "./meta";
export { certificateTemplates } from "./registry";
export type { CertificatePdfPayload } from "./types";
export { renderCertificatePdf } from "./render-certificate-pdf";
export { MinimalCertificate } from "./templates/minimal";
