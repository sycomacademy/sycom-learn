/** Client-safe catalogue of presets (no `@react-pdf/renderer` imports). */

export const CERTIFICATE_TEMPLATE_IDS = ["minimal", "default"] as const;
export type CertificateTemplateId = (typeof CERTIFICATE_TEMPLATE_IDS)[number];

export const certificateTemplateLabels: Record<CertificateTemplateId, string> = {
  minimal: "Minimal",
  default: "Default",
};

export const certificateTemplateDescriptions: Record<CertificateTemplateId, string> = {
  minimal:
    "Bordered landscape layout with branding, learner name, course title, certificate number and date.",
  default:
    "Standard certificate layout with branding, learner name, course title, certificate number and date.",
};

export function isCertificateTemplateId(id: string): id is CertificateTemplateId {
  return (CERTIFICATE_TEMPLATE_IDS as readonly string[]).includes(id);
}
