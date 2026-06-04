import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Input } from "@sycom/ui/components/input";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export type OrgStudentProfileField =
  AppRouterOutputs["organization"]["getStudentProfileFields"]["fields"][number];

type InviteStudentProfileFieldsProps = {
  fields: OrgStudentProfileField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  errors?: Record<string, string | undefined>;
};

export function InviteStudentProfileFields({
  fields,
  values,
  onChange,
  errors,
}: InviteStudentProfileFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Student profile</p>
      {fields.map((field) => (
        <Field key={field.id}>
          <FieldLabel>
            {field.label}
            {field.required ? " *" : null}
          </FieldLabel>
          <Input
            autoComplete="off"
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder ?? undefined}
            type={field.type === "number" ? "number" : "text"}
            value={values[field.id] ?? ""}
          />
          <FieldError reserveSpace>{errors?.[field.id]}</FieldError>
        </Field>
      ))}
    </div>
  );
}

export function buildStudentProfilePayload(
  fields: OrgStudentProfileField[],
  values: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.id] ?? "";
    if (field.type === "number") {
      out[field.id] = raw.trim() === "" ? null : Number(raw);
    } else {
      const str = raw.trim();
      out[field.id] = str.length === 0 ? null : str;
    }
  }
  return out;
}

export function validateStudentProfileValuesClient(
  fields: OrgStudentProfileField[],
  values: Record<string, string>,
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {};
  for (const field of fields) {
    const raw = (values[field.id] ?? "").trim();
    if (field.required && raw.length === 0) {
      errors[field.id] = `${field.label} is required`;
      continue;
    }
    if (field.type === "number" && raw.length > 0 && !Number.isFinite(Number(raw))) {
      errors[field.id] = `${field.label} must be a valid number`;
    }
  }
  return errors;
}
