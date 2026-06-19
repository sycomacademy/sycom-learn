/**
 * Repair lesson content whose file attachments point to the wrong Cloudinary
 * delivery path.
 *
 * Root cause: the inline curriculum editor saved file attachments without the
 * Cloudinary resource type, so they default to `file` (→ /raw/ delivery). But
 * Cloudinary stores PDFs (and other doc-as-image formats) as `image`, so the
 * /raw/ URL 404s for students. This rewrites each `fileAttachment` node's
 * `resourceType` (and `format`) to match the asset's REAL Cloudinary type.
 *
 * DRY-RUN by default (prints the changes). Pass --apply to write them.
 *
 * Usage (from repo root):
 *   DATABASE_URL='postgres://…' bun run scripts/fix-lesson-asset-types.ts          # dry-run
 *   DATABASE_URL='postgres://…' bun run scripts/fix-lesson-asset-types.ts --apply  # write
 *
 * Cloudinary creds are read from apps/server/.env.
 */

import { join } from "node:path";
import { SQL } from "bun";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

const ROOT = join(import.meta.dir, "..");
dotenv.config({ path: join(ROOT, "apps/server/.env") });

const CLOUD_ROOT = "sycom-lms";
const RESOURCE_TYPES = ["image", "video", "raw"] as const;
const APPLY = process.argv.includes("--apply");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!cloudName || !apiKey || !apiSecret || !databaseUrl) {
  console.error("Missing CLOUDINARY_* (apps/server/.env) or DATABASE_URL (env).");
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

/** App resource kind, mirrors StorageResourceType. */
type AppResourceType = "image" | "video" | "audio" | "file";

function cloudToApp(resourceType: string): AppResourceType {
  if (resourceType === "image" || resourceType === "video") return resourceType;
  return "file"; // raw → file
}

type CloudInfo = { resourceType: AppResourceType; format?: string };

async function buildCloudMap(): Promise<Map<string, CloudInfo>> {
  const map = new Map<string, CloudInfo>();
  for (const resourceType of RESOURCE_TYPES) {
    let nextCursor: string | undefined;
    do {
      const res = await cloudinary.api.resources({
        resource_type: resourceType,
        type: "upload",
        prefix: `${CLOUD_ROOT}/`,
        max_results: 500,
        next_cursor: nextCursor,
      });
      for (const r of res.resources as Array<Record<string, unknown>>) {
        const publicId = String(r.public_id);
        const info: CloudInfo = {
          resourceType: cloudToApp(resourceType),
          format: r.format ? String(r.format) : undefined,
        };
        map.set(publicId, info);
        map.set(publicId.replace(/\.[^./]+$/, ""), info); // also keyed without extension
      }
      nextCursor = res.next_cursor as string | undefined;
    } while (nextCursor);
  }
  return map;
}

function lookup(map: Map<string, CloudInfo>, src: string): CloudInfo | undefined {
  return map.get(src) ?? map.get(src.replace(/\.[^./]+$/, ""));
}

type Change = { lessonId: string; src: string; from: string; to: string };

/** Mutates fileAttachment nodes in place; returns the list of changes made. */
function repairNode(
  node: Record<string, unknown>,
  cloudMap: Map<string, CloudInfo>,
  lessonId: string,
  changes: Change[],
): void {
  if (node.type === "fileAttachment" && node.attrs && typeof node.attrs === "object") {
    const attrs = node.attrs as Record<string, unknown>;
    const src = typeof attrs.src === "string" ? attrs.src : null;
    if (src) {
      const info = lookup(cloudMap, src);
      if (info) {
        const currentType = attrs.resourceType;
        const currentFormat = attrs.format ?? null;
        const nextFormat = info.format ?? currentFormat ?? null;
        if (currentType !== info.resourceType || currentFormat !== nextFormat) {
          changes.push({
            lessonId,
            src,
            from: `resourceType=${String(currentType)}, format=${String(currentFormat)}`,
            to: `resourceType=${info.resourceType}, format=${String(nextFormat)}`,
          });
          attrs.resourceType = info.resourceType;
          attrs.format = nextFormat;
        }
      } else {
        console.warn(`  ! no Cloudinary asset found for ${src} (lesson ${lessonId}) — skipped`);
      }
    }
  }
  const content = node.content;
  if (Array.isArray(content)) {
    for (const child of content) {
      if (child && typeof child === "object") {
        repairNode(child as Record<string, unknown>, cloudMap, lessonId, changes);
      }
    }
  }
}

async function main() {
  console.log(`Cloud: ${cloudName} — mode: ${APPLY ? "APPLY (writing)" : "DRY-RUN"}\n`);
  const cloudMap = await buildCloudMap();

  const sql = new SQL(databaseUrl as string);
  try {
    const lessons = (await sql`
      SELECT id, content FROM lesson WHERE content IS NOT NULL
    `) as Array<{ id: string; content: unknown }>;

    let totalChanges = 0;
    for (const lesson of lessons) {
      let doc = lesson.content;
      // Recover from a prior bad write that stored JSON as a jsonb string scalar.
      if (typeof doc === "string") {
        try {
          doc = JSON.parse(doc) as Record<string, unknown>;
        } catch {
          console.warn(`  ! lesson ${lesson.id}: content is not valid JSON — skipped`);
          continue;
        }
      }
      if (!doc || typeof doc !== "object" || Array.isArray(doc)) continue;
      const changes: Change[] = [];
      repairNode(doc, cloudMap, lesson.id, changes);
      if (changes.length === 0) continue;

      totalChanges += changes.length;
      console.log(`lesson ${lesson.id}: ${changes.length} attachment(s) to fix`);
      for (const c of changes) console.log(`  • ${c.src}\n      ${c.from}  ->  ${c.to}`);

      if (APPLY) {
        // Pass the object directly — JSON.stringify() + ::jsonb stores a string scalar.
        await sql`
          UPDATE lesson SET content = ${doc}, updated_at = now()
          WHERE id = ${lesson.id}
        `;
        console.log("  ✓ applied");
      }
    }

    console.log("");
    if (totalChanges === 0) {
      console.log("No fixes needed.");
    } else if (APPLY) {
      console.log(`Applied ${totalChanges} fix(es).`);
    } else {
      console.log(`${totalChanges} fix(es) pending. Re-run with --apply to write them.`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
