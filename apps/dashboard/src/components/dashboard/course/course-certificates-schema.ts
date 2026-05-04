import { z } from "zod";

export const certificatesPanelSchema = z.enum(["design", "members"]);

export const courseCertificatesSearchSchema = z.object({
  panel: certificatesPanelSchema.optional().default("design"),
  search: z.string().trim().min(1).optional(),
});

export type CourseCertificatesSearchInput = z.infer<typeof courseCertificatesSearchSchema>;
export type CertificatesPanel = z.infer<typeof certificatesPanelSchema>;
