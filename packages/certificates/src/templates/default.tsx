import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { BrandMark } from "../_components/brand-mark";
import { certificateColors } from "../_components/theme";
import type { CertificatePdfPayload } from "../types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: certificateColors.background,
    padding: 48,
    fontFamily: "Helvetica",
  },
  frame: {
    flex: 1,
    borderWidth: 2,
    borderColor: certificateColors.primary,
    borderRadius: 4,
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: certificateColors.muted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    color: certificateColors.primary,
    marginBottom: 32,
    fontFamily: "Helvetica-Bold",
  },
  label: {
    fontSize: 11,
    color: certificateColors.muted,
    marginBottom: 6,
  },
  recipient: {
    fontSize: 26,
    color: certificateColors.foreground,
    textAlign: "center",
    marginBottom: 28,
    fontFamily: "Helvetica-Bold",
  },
  course: {
    fontSize: 14,
    color: certificateColors.foreground,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 1.35,
  },
  footerWrapper: {
    position: "absolute",
    bottom: 56,
    left: 56,
    right: 56,
  },
  footnote: {
    fontSize: 9,
    color: certificateColors.muted,
    textAlign: "center",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: certificateColors.border,
    paddingTop: 12,
  },
  footerMuted: {
    fontSize: 9,
    color: certificateColors.muted,
  },
  footerStrong: {
    fontSize: 9,
    color: certificateColors.foreground,
    fontFamily: "Helvetica-Bold",
  },
  issuer: {
    marginTop: 36,
    fontSize: 11,
    color: certificateColors.muted,
    textAlign: "center",
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

export function DefaultCertificate({
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

  return (
    <Document title={`Certificate — ${courseTitle}`} subject="Course completion" language="en">
      <Page orientation="landscape" size="A4" style={styles.page}>
        <View style={styles.frame}>
          <BrandMark align="center" />
          <Text style={styles.kicker}>{headline}</Text>
          <Text style={styles.title}>{certify}</Text>
          <Text style={styles.label}>Recipient</Text>
          <Text style={styles.recipient}>{recipientName}</Text>
          <Text style={styles.label}>has successfully completed</Text>
          <Text style={styles.course}>{courseTitle}</Text>
          {issuerLine?.trim() ? (
            <Text style={styles.issuer}>Issued by: {issuerLine.trim()}</Text>
          ) : null}
        </View>
        <View fixed style={styles.footerWrapper}>
          {footnoteLine?.trim() ? <Text style={styles.footnote}>{footnoteLine.trim()}</Text> : null}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerMuted}>Certificate no.</Text>
              <Text style={styles.footerStrong}>{certificateNumber}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.footerMuted}>Issued on</Text>
              <Text style={styles.footerStrong}>{formatIssuedDate(issuedAt)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
