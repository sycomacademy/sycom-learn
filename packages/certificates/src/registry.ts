import type { CertificateTemplateComponent } from "./templates/types";
import { MinimalCertificate } from "./templates/minimal";

export const CERTIFICATE_TEMPLATE_IDS = ["minimal"] as const;
export type CertificateTemplateId = (typeof CERTIFICATE_TEMPLATE_IDS)[number];

export const certificateTemplates: Record<CertificateTemplateId, CertificateTemplateComponent> = {
  minimal: MinimalCertificate,
};

export function isCertificateTemplateId(id: string): id is CertificateTemplateId {
  return (CERTIFICATE_TEMPLATE_IDS as readonly string[]).includes(id);
}
