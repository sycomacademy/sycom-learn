import type { ComponentType } from "react";

import type { CertificatePdfPayload } from "../types";

/** Root of the tree must be a single react-pdf `<Document />`. */
export type CertificateTemplateComponent = ComponentType<CertificatePdfPayload>;
