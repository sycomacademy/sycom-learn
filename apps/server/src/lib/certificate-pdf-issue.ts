import {
  mergeCertificatePdfPayload,
  type CertificateIssueFacts,
} from "@sycom/certificates/course-settings";
import { renderCertificatePdf } from "@sycom/certificates";

/**
 * Renders a course-completion PDF using {@link mergeCertificatePdfPayload}
 * (course JSONB + issuance facts). Use from email/send flows.
 */
export async function renderIssuedCertificatePdfBuffer(
  courseCertificateSettings: unknown | null | undefined,
  issue: CertificateIssueFacts,
): Promise<Buffer> {
  const { templateId, payload } = mergeCertificatePdfPayload(courseCertificateSettings, issue);
  return renderCertificatePdf(templateId, payload);
}
