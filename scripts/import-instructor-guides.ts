/**
 * Upload local instructor-guide PDFs into CYB 109 (Semester 2) lessons.
 *
 * DRY-RUN by default. Pass --apply to upload to Cloudinary and write prod DB.
 *
 * Usage:
 *   DATABASE_URL='…' bun run scripts/import-instructor-guides.ts
 *   DATABASE_URL='…' bun run scripts/import-instructor-guides.ts --apply
 */

import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { SQL } from "bun";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

const ROOT = join(import.meta.dir, "..");
dotenv.config({ path: join(ROOT, "apps/server/.env") });

const APPLY = process.argv.includes("--apply");
const MATERIALS_DIR = "/Users/asa/Downloads/LMS material";
const COURSE_ID = "crs_ad3299fb-e965-4d70-8fd9-0f44b04ee5d3";
const CLOUD_ROOT = "sycom-lms";
const UPLOADER_ID = "B7UCKkrWlt1kGvEWGcLfqRrL69ltIjIJ";
const UPLOADER_EMAIL = "a.shehu@sycomsolutions.com";

type SectionPlan = {
  sectionId: string;
  sectionTitle: string;
  /** Existing lesson id when already present. */
  lessonId?: string;
  fileNames: string[];
};

const PLANS: SectionPlan[] = [
  {
    sectionId: "sec_17bc087e-9c91-4c88-b510-e62265560cf7",
    sectionTitle: "Networking Practical - Student Handbook",
    lessonId: "lsn_0fc4e6d0-353b-4c13-aa6a-715cde2fd63f",
    fileNames: [], // already populated in prod
  },
  {
    sectionId: "sec_29982a11-e365-4081-b5d7-3739995dfa43",
    sectionTitle: "Subnetting, IP Addressing & Routing",
    fileNames: ["Subnetting-IP-Addressing-and-Routing-Fundamentals wk2 2nd semester.pdf"],
  },
  {
    sectionId: "sec_ecfce3fe-a3aa-42c1-a242-376e76a52509",
    sectionTitle: "Packet analysis using Wireshark",
    fileNames: [
      "Packet analysis using wireshark.pdf",
      "Packet analysis _Wireshark Installation Guide.pdf",
    ],
  },
  {
    sectionId: "sec_7be037d4-8714-4e49-8f4c-d246137c6fc3",
    sectionTitle: "Deploying pfSense Firewall in a Virtualized Environment (VirtualBox)",
    fileNames: [
      "Deploying-pfSense-Firewall-in-a-Virtualized-Environment.pdf",
      "Deploying pfsense (cntd).pdf",
    ],
  },
  {
    sectionId: "sec_80449223-6fb3-4bde-8745-72bfe6031dbb",
    sectionTitle: "Python Scripting for Network Automation",
    fileNames: [
      "Python-Scripting-for-Network-Automation.pdf",
      "Prt 2 Python Scripting for Security Automation Final.pdf",
    ],
  },
  {
    sectionId: "sec_875af7e2-4d62-42d6-9a93-af3d781810cb",
    sectionTitle: "Introduction to Vulnerable Assessment",
    fileNames: ["Vulnerability management.pdf"],
  },
];

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!cloudName || !apiKey || !apiSecret || !databaseUrl) {
  console.error("Missing CLOUDINARY_* (apps/server/.env) or DATABASE_URL.");
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

function displayName(fileName: string): string {
  return basename(fileName).replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function cloudToStorageResourceType(type: string): "image" | "video" | "audio" | "file" {
  if (type === "image" || type === "video" || type === "audio") return type;
  return "file";
}

function fileAttachmentNode(input: {
  publicId: string;
  name: string;
  bytes: number;
  format: string;
  resourceType: "image" | "video" | "audio" | "file";
}) {
  return {
    type: "fileAttachment",
    attrs: {
      src: input.publicId,
      name: input.name,
      size: input.bytes,
      format: input.format,
      mimeType: "application/pdf",
      resourceType: input.resourceType,
    },
  };
}

function lessonDocument(nodes: ReturnType<typeof fileAttachmentNode>[]) {
  return {
    type: "doc",
    content: [...nodes, { type: "paragraph", attrs: { textAlign: null } }],
  };
}

async function ensureInstructorLesson(sql: SQL, plan: SectionPlan): Promise<string> {
  if (plan.lessonId) return plan.lessonId;

  const existing = await sql`
    SELECT id FROM lesson
    WHERE section_id = ${plan.sectionId}
      AND upper(title) = 'INSTRUCTOR GUIDE'
    LIMIT 1
  `;
  if (existing[0]?.id) return String(existing[0].id);

  const [orderRow] = await sql`
    SELECT COALESCE(MAX("order"), -1) + 1 AS next_order
    FROM lesson WHERE section_id = ${plan.sectionId}
  `;
  const nextOrder = Number(orderRow?.next_order ?? 0);
  const lessonId = `lsn_${crypto.randomUUID()}`;

  if (APPLY) {
    await sql`
      INSERT INTO lesson (id, section_id, title, type, "order", content)
      VALUES (${lessonId}, ${plan.sectionId}, 'INSTRUCTOR GUIDE', 'article', ${nextOrder}, NULL)
    `;
  }

  console.log(`  + create INSTRUCTOR GUIDE lesson ${lessonId} (order ${nextOrder})`);
  return lessonId;
}

async function uploadPdf(
  lessonId: string,
  filePath: string,
): Promise<{
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
  resourceType: "image" | "video" | "audio" | "file";
  name: string;
}> {
  const fileId = crypto.randomUUID();
  const publicId = `${CLOUD_ROOT}/lesson_artifacts/${lessonId}/${fileId}`;
  const assetFolder = `${CLOUD_ROOT}/lesson_artifacts/${lessonId}`;
  const name = displayName(filePath);

  if (!APPLY) {
    const bytes = statSync(filePath).size;
    return {
      publicId,
      secureUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.pdf`,
      bytes,
      format: "pdf",
      resourceType: "image",
      name,
    };
  }

  const tags = [
    "entity_type:lesson",
    `entity_id:${lessonId}`,
    `uploaded_by:${UPLOADER_ID}`,
    `uploaded_by_email:${UPLOADER_EMAIL.replace(/@/g, "_")}`,
  ];
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      asset_folder: assetFolder,
      public_id: publicId,
      tags: tags.join(","),
      timestamp,
    },
    apiSecret,
  );

  const formData = new FormData();
  formData.append("file", Bun.file(filePath));
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("public_id", publicId);
  formData.append("asset_folder", assetFolder);
  formData.append("tags", tags.join(","));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    format?: string;
    bytes?: number;
    resource_type?: string;
    error?: { message?: string };
  };

  if (!response.ok || !result.secure_url || !result.public_id) {
    throw new Error(result.error?.message ?? `Cloudinary upload failed (${response.status})`);
  }

  const resourceType = cloudToStorageResourceType(String(result.resource_type ?? "image"));
  return {
    publicId: String(result.public_id),
    secureUrl: String(result.secure_url),
    bytes: Number(result.bytes),
    format: String(result.format ?? "pdf"),
    resourceType,
    name,
  };
}

async function main() {
  const available = new Set(readdirSync(MATERIALS_DIR).filter((f) => f.endsWith(".pdf")));
  const sql = new SQL(databaseUrl);

  console.log(APPLY ? "APPLY mode" : "DRY-RUN (pass --apply to write)");
  console.log(`Course: ${COURSE_ID}`);
  console.log(`Materials: ${MATERIALS_DIR}\n`);

  for (const plan of PLANS) {
    console.log(`Section: ${plan.sectionTitle}`);

    if (plan.fileNames.length === 0) {
      console.log("  skip (already populated)\n");
      continue;
    }

    for (const fileName of plan.fileNames) {
      if (!available.has(fileName)) {
        console.error(`  ! missing file: ${fileName}`);
        process.exit(1);
      }
    }

    const lessonId = await ensureInstructorLesson(sql, plan);
    const nodes: ReturnType<typeof fileAttachmentNode>[] = [];

    for (const fileName of plan.fileNames) {
      const filePath = join(MATERIALS_DIR, fileName);
      console.log(`  → upload ${fileName}`);
      const uploaded = await uploadPdf(lessonId, filePath);
      nodes.push(
        fileAttachmentNode({
          publicId: uploaded.publicId,
          name: uploaded.name,
          bytes: uploaded.bytes,
          format: uploaded.format,
          resourceType: uploaded.resourceType,
        }),
      );

      if (APPLY) {
        const storageTags = [
          "entity_type:lesson",
          `entity_id:${lessonId}`,
          `uploaded_by:${UPLOADER_ID}`,
          `uploaded_by_email:${UPLOADER_EMAIL}`,
        ];
        const tagsPg = `{${storageTags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(",")}}`;
        await sql`
          INSERT INTO storage (
            id, public_id, secure_url, name, format, bytes, width, height,
            folder, resource_type, entity_type, entity_id, tags,
            uploaded_by, uploader_email
          ) VALUES (
            ${crypto.randomUUID()},
            ${uploaded.publicId},
            ${uploaded.secureUrl},
            ${uploaded.name},
            ${uploaded.format},
            ${uploaded.bytes},
            NULL,
            NULL,
            'lesson_artifacts',
            ${uploaded.resourceType},
            'lesson',
            ${lessonId},
            ${tagsPg}::text[],
            ${UPLOADER_ID},
            ${UPLOADER_EMAIL}
          )
          ON CONFLICT (public_id) DO UPDATE SET
            secure_url = EXCLUDED.secure_url,
            bytes = EXCLUDED.bytes,
            updated_at = NOW()
        `;
      }
    }

    const content = lessonDocument(nodes);
    if (APPLY) {
      await sql`
        UPDATE lesson
        SET content = ${content}, updated_at = NOW()
        WHERE id = ${lessonId}
      `;
    }

    console.log(`  ✓ lesson ${lessonId} → ${plan.fileNames.length} attachment(s)\n`);
  }

  await sql.close();
  console.log(APPLY ? "Import complete." : "Dry-run complete. Re-run with --apply.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
