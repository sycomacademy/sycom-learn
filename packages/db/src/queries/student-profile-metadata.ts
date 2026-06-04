import { and, eq, sql } from "drizzle-orm";

import type { Database } from "..";
import { member, organization } from "../schema/auth";
import type { OrganizationRole } from "../schema/auth";
import type {
  InvitationMetadata,
  MemberMetadata,
  OrgStudentProfileField,
  OrganizationMetadataPayload,
  StudentProfileValues,
} from "../schema/student-profile";

const FIELD_ID_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const MAX_FIELDS = 50;

export class StudentProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentProfileValidationError";
  }
}

function parseOrganizationMetadataString(metadata: string | null): OrganizationMetadataPayload {
  if (!metadata) return {};
  try {
    const parsed: unknown = JSON.parse(metadata);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as OrganizationMetadataPayload;
  } catch {
    return {};
  }
}

function normalizeFieldDef(raw: OrgStudentProfileField): OrgStudentProfileField {
  return {
    id: raw.id.trim(),
    label: raw.label.trim(),
    type: raw.type,
    required: raw.required === true,
    placeholder: raw.placeholder?.trim() || undefined,
    order: raw.order,
  };
}

export function validateOrgStudentProfileFields(
  fields: OrgStudentProfileField[],
): OrgStudentProfileField[] {
  if (fields.length > MAX_FIELDS) {
    throw new StudentProfileValidationError(`At most ${MAX_FIELDS} fields are allowed`);
  }

  const seenIds = new Set<string>();
  const normalized: OrgStudentProfileField[] = [];

  for (const raw of fields) {
    const field = normalizeFieldDef(raw);
    if (!FIELD_ID_PATTERN.test(field.id)) {
      throw new StudentProfileValidationError(
        `Field id "${field.id}" must be lowercase letters, numbers, and underscores, starting with a letter`,
      );
    }
    if (field.label.length < 1 || field.label.length > 120) {
      throw new StudentProfileValidationError(
        "Each field label must be between 1 and 120 characters",
      );
    }
    if (field.type !== "text" && field.type !== "number") {
      throw new StudentProfileValidationError(`Field "${field.id}" has an invalid type`);
    }
    if (seenIds.has(field.id)) {
      throw new StudentProfileValidationError(`Duplicate field id "${field.id}"`);
    }
    seenIds.add(field.id);
    normalized.push(field);
  }

  return normalized.toSorted((a, b) => a.order - b.order);
}

export function filterStudentProfileValues(
  fields: OrgStudentProfileField[],
  raw: StudentProfileValues | undefined,
): StudentProfileValues {
  if (!raw) return {};
  const allowed = new Set(fields.map((f) => f.id));
  const result: StudentProfileValues = {};
  for (const [key, value] of Object.entries(raw)) {
    if (allowed.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

export function validateAndNormalizeStudentProfileValues(
  fields: OrgStudentProfileField[],
  input: Record<string, unknown>,
): StudentProfileValues {
  const fieldById = new Map(fields.map((f) => [f.id, f]));
  const result: StudentProfileValues = {};

  for (const key of Object.keys(input)) {
    if (!fieldById.has(key)) {
      throw new StudentProfileValidationError(`Unknown field "${key}"`);
    }
  }

  for (const field of fields) {
    const raw = input[field.id];
    let normalized: string | number | null;

    if (raw === undefined || raw === null) {
      normalized = null;
    } else if (field.type === "number") {
      const num = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(num)) {
        throw new StudentProfileValidationError(`"${field.label}" must be a valid number`);
      }
      normalized = num;
    } else {
      const str = typeof raw === "string" ? raw.trim() : String(raw).trim();
      normalized = str.length === 0 ? null : str;
    }

    if (field.required && (normalized === null || normalized === "")) {
      throw new StudentProfileValidationError(`"${field.label}" is required`);
    }

    result[field.id] = normalized;
  }

  return result;
}

function parseStoredOrgStudentProfileFields(
  meta: OrganizationMetadataPayload,
): OrgStudentProfileField[] {
  const raw = meta.studentProfileFields;
  if (!Array.isArray(raw)) return [];

  const candidates: OrgStudentProfileField[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const field = item as OrgStudentProfileField;
    if (
      typeof field.id !== "string" ||
      typeof field.label !== "string" ||
      (field.type !== "text" && field.type !== "number") ||
      typeof field.order !== "number"
    ) {
      continue;
    }
    try {
      candidates.push(normalizeFieldDef(field));
    } catch {
      continue;
    }
  }

  try {
    return validateOrgStudentProfileFields(candidates);
  } catch {
    return candidates.toSorted((a, b) => a.order - b.order);
  }
}

export async function getOrgStudentProfileFields(
  database: Database,
  input: { organizationId: string },
): Promise<OrgStudentProfileField[]> {
  const row = await database.query.organization.findFirst({
    columns: { metadata: true },
    where: eq(organization.id, input.organizationId),
  });
  if (!row) return [];

  const meta = parseOrganizationMetadataString(row.metadata);
  return parseStoredOrgStudentProfileFields(meta);
}

async function memberHasValueForField(
  database: Database,
  input: { organizationId: string; fieldId: string },
): Promise<boolean> {
  const [row] = await database
    .select({ hasValue: sql<boolean>`true` })
    .from(member)
    .where(
      and(
        eq(member.organizationId, input.organizationId),
        eq(member.role, "student"),
        sql`${member.metadata}->'studentProfile'->>${input.fieldId} IS NOT NULL`,
        sql`${member.metadata}->'studentProfile'->>${input.fieldId} != ''`,
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function replaceOrgStudentProfileFields(
  database: Database,
  input: { organizationId: string; fields: OrgStudentProfileField[] },
): Promise<OrgStudentProfileField[]> {
  const normalized = validateOrgStudentProfileFields(input.fields);

  const row = await database.query.organization.findFirst({
    columns: { metadata: true },
    where: eq(organization.id, input.organizationId),
  });
  if (!row) {
    throw new StudentProfileValidationError("Organization not found");
  }

  const meta = parseOrganizationMetadataString(row.metadata);
  const previous = meta.studentProfileFields ?? [];
  const previousById = new Map(previous.map((f) => [f.id, f]));

  for (const field of normalized) {
    const prev = previousById.get(field.id);
    if (prev && prev.type !== field.type) {
      const inUse = await memberHasValueForField(database, {
        organizationId: input.organizationId,
        fieldId: field.id,
      });
      if (inUse) {
        throw new StudentProfileValidationError(
          `Cannot change type for "${field.label}" while members have values. Clear member data first.`,
        );
      }
    }
  }

  meta.studentProfileFields = normalized;

  await database
    .update(organization)
    .set({ metadata: JSON.stringify(meta) })
    .where(eq(organization.id, input.organizationId));

  return normalized;
}

export async function getMemberStudentProfileValues(
  database: Database,
  input: { organizationId: string; memberId: string },
): Promise<StudentProfileValues> {
  const fields = await getOrgStudentProfileFields(database, {
    organizationId: input.organizationId,
  });

  const [row] = await database
    .select({ metadata: member.metadata, role: member.role })
    .from(member)
    .where(and(eq(member.id, input.memberId), eq(member.organizationId, input.organizationId)))
    .limit(1);

  if (!row) return {};

  const meta = (row.metadata ?? {}) as MemberMetadata;
  return filterStudentProfileValues(fields, meta.studentProfile);
}

export async function updateMemberStudentProfileValues(
  database: Database,
  input: {
    organizationId: string;
    memberId: string;
    values: Record<string, unknown>;
  },
): Promise<StudentProfileValues> {
  const fields = await getOrgStudentProfileFields(database, {
    organizationId: input.organizationId,
  });

  const [row] = await database
    .select({ metadata: member.metadata, role: member.role })
    .from(member)
    .where(and(eq(member.id, input.memberId), eq(member.organizationId, input.organizationId)))
    .limit(1);

  if (!row) {
    throw new StudentProfileValidationError("Member not found");
  }
  if (row.role !== "student") {
    throw new StudentProfileValidationError(
      "Student profile metadata applies only to members with the student role",
    );
  }

  const normalized = validateAndNormalizeStudentProfileValues(fields, input.values);
  const existing = (row.metadata ?? {}) as MemberMetadata;
  const nextMetadata: MemberMetadata = {
    ...existing,
    studentProfile: normalized,
  };

  await database
    .update(member)
    .set({ metadata: nextMetadata })
    .where(and(eq(member.id, input.memberId), eq(member.organizationId, input.organizationId)));

  return normalized;
}

export async function validateStudentProfileForInvite(
  database: Database,
  input: {
    organizationId: string;
    role: OrganizationRole;
    values?: Record<string, unknown>;
  },
): Promise<InvitationMetadata> {
  const raw = input.values ?? {};
  const hasValues = Object.keys(raw).length > 0;

  if (input.role !== "student") {
    if (hasValues) {
      throw new StudentProfileValidationError(
        "Student profile metadata can only be set for student invites",
      );
    }
    return {};
  }

  const fields = await getOrgStudentProfileFields(database, {
    organizationId: input.organizationId,
  });
  if (fields.length === 0) {
    if (hasValues) {
      throw new StudentProfileValidationError(
        "This organization has no student profile fields configured",
      );
    }
    return {};
  }

  const studentProfile = validateAndNormalizeStudentProfileValues(fields, raw);
  return { studentProfile };
}

/** Copy invitation student profile onto a new member row when applicable. */
export function memberMetadataFromInvitationMetadata(
  role: OrganizationRole,
  metadata: InvitationMetadata | null | undefined,
): MemberMetadata | undefined {
  if (role !== "student") return undefined;
  const studentProfile = metadata?.studentProfile;
  if (!studentProfile || Object.keys(studentProfile).length === 0) {
    return undefined;
  }
  return { studentProfile };
}

/** Resolve student profile values for a member row when field defs are already loaded. */
export function resolveStudentProfileForMember(
  fields: OrgStudentProfileField[],
  metadata: MemberMetadata | null | undefined,
): StudentProfileValues {
  return filterStudentProfileValues(fields, metadata?.studentProfile);
}
