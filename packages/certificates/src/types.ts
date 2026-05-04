/**
 * Data passed into every certificate PDF template. Populated at issue time.
 */
export type CertificatePdfPayload = {
  recipientName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: Date;
  /** Printed near the signature area, e.g. organization or platform name */
  issuerLine?: string;
};
