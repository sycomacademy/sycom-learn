import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { BrandMark } from "../_components/brand-mark";
import { certificateColors } from "../_components/theme";
import type { CertificatePdfPayload } from "../types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: certificateColors.background,
    padding: 56,
    paddingBottom: 112,
    fontFamily: "Helvetica",
    position: "relative",
  },
  main: {
    flexGrow: 1,
    justifyContent: "center",
    alignSelf: "stretch",
    maxWidth: 520,
    alignItems: "flex-start",
    minHeight: 0,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    color: certificateColors.muted,
    textTransform: "uppercase",
    marginBottom: 14,
    textAlign: "left",
  },
  certify: {
    fontSize: 13,
    color: certificateColors.primary,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    lineHeight: 1.35,
  },
  label: {
    fontSize: 10,
    color: certificateColors.muted,
    marginBottom: 4,
    textAlign: "left",
  },
  recipient: {
    fontSize: 32,
    color: certificateColors.foreground,
    fontFamily: "Helvetica-Bold",
    marginBottom: 20,
    lineHeight: 1.15,
    textAlign: "left",
  },
  completionLabel: {
    fontSize: 10,
    color: certificateColors.muted,
    marginBottom: 6,
  },
  course: {
    fontSize: 15,
    color: certificateColors.foreground,
    lineHeight: 1.4,
    textAlign: "left",
    maxWidth: 480,
    marginBottom: 12,
  },
  issuer: {
    fontSize: 10,
    color: certificateColors.muted,
    marginTop: 8,
    lineHeight: 1.35,
  },
  footerBlock: {
    position: "absolute",
    bottom: 48,
    left: 56,
    right: 56,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: certificateColors.border,
  },
  footerLine: {
    fontSize: 8.5,
    color: certificateColors.muted,
    lineHeight: 1.4,
    textAlign: "left",
  },
});

function formatIssuedDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const DEFAULT_AWARD_HEADLINE = "Certificate of completion";
const DEFAULT_CERTIFY_PHRASE = "This is to certify that";

export function MinimalCertificate({
  recipientName,
  courseTitle,
  certificateNumber,
  issuedAt,
  issuerLine,
  awardHeadline,
  certifyPhrase,
  footnoteLine,
}: CertificatePdfPayload) {
  const headline = awardHeadline?.trim() || DEFAULT_AWARD_HEADLINE;
  const certify = certifyPhrase?.trim() || DEFAULT_CERTIFY_PHRASE;
  const foot = footnoteLine?.trim();
  const footerText = `Certificate no. ${certificateNumber} · Issued ${formatIssuedDate(issuedAt)}${foot ? ` · ${foot}` : ""}`;

  return (
    <Document title={`Certificate — ${courseTitle}`} subject="Course completion" language="en">
      <Page orientation="landscape" size="A4" style={styles.page}>
        <View style={styles.main}>
          <BrandMark align="flex-start" />
          <Text style={styles.kicker}>{headline}</Text>
          <Text style={styles.certify}>{certify}</Text>
          <Text style={styles.label}>Recipient</Text>
          <Text style={styles.recipient}>{recipientName}</Text>
          <Text style={styles.completionLabel}>has successfully completed</Text>
          <Text style={styles.course}>{courseTitle}</Text>
          {issuerLine?.trim() ? (
            <Text style={styles.issuer}>Issued by: {issuerLine.trim()}</Text>
          ) : null}
        </View>
        <View fixed style={styles.footerBlock}>
          <Text style={styles.footerLine}>{footerText}</Text>
        </View>
      </Page>
    </Document>
  );
}
