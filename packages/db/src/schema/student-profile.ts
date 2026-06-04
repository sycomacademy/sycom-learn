export type OrgStudentProfileFieldType = "text" | "number";

export type OrgStudentProfileField = {
  id: string;
  label: string;
  type: OrgStudentProfileFieldType;
  required?: boolean;
  placeholder?: string;
  order: number;
};

export type StudentProfileValues = Record<string, string | number | null>;

export type MemberMetadata = {
  studentProfile?: StudentProfileValues;
};

/** Pending org member invitation metadata (copied to member on accept). */
export type InvitationMetadata = {
  studentProfile?: StudentProfileValues;
};

export type OrganizationMetadataPayload = {
  accentHex?: string;
  studentProfileFields?: OrgStudentProfileField[];
};
