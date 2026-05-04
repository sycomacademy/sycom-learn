/**
 * Data passed into every certificate PDF template. Populated at issue time.
 */
export type CertificatePdfPayload = {
  recipientName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: Date;
  /** Top kicker in uppercase spacing (default: Certificate of completion) */
  awardHeadline?: string;
  /** Bold line before learner name (default: This is to certify that) */
  certifyPhrase?: string;
  /** Printed near the signature area, e.g. organization or platform name */
  issuerLine?: string;
  /** Optional note above footer details */
  footnoteLine?: string;
};
