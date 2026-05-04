import {
  CERTIFICATE_TEMPLATE_IDS,
  type CertificateTemplateId,
  isCertificateTemplateId,
} from "./meta";
import type { CertificateTemplateComponent } from "./templates/types";
import { MinimalCertificate } from "./templates/minimal";
import { DefaultCertificate } from "./templates/default";

export const certificateTemplates: Record<CertificateTemplateId, CertificateTemplateComponent> = {
  minimal: MinimalCertificate,
  default: DefaultCertificate,
};

export { CERTIFICATE_TEMPLATE_IDS, type CertificateTemplateId, isCertificateTemplateId };
