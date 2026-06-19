/**
 * READ-ONLY audit: find Cloudinary assets that the database no longer references.
 *
 * It NEVER deletes anything. It produces:
 *   - a console summary
 *   - scripts/cloudinary-audit-report.json   (full machine-readable detail)
 *   - scripts/cloudinary-delete-orphans.sh   (a script YOU run to delete, after review)
 *
 * Two buckets are reported:
 *   A) UNREGISTERED orphans — live in Cloudinary under the app root but have NO row
 *      in the `storage` table. These are upload leftovers (e.g. a file landed in
 *      Cloudinary but `saveAsset` never recorded it). Safe to delete.
 *   B) STALE registered assets — have a `storage` row but are not referenced by any
 *      lesson content / course image / avatar / logo / feedback image. These are
 *      mostly re-upload duplicates. Review before deleting (NOT auto-added to the
 *      delete script).
 *
 * Usage (from repo root):
 *   bun run scripts/cloudinary-audit.ts
 *
 * Requires CLOUDINARY_* and DATABASE_URL in apps/server/.env.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { SQL } from "bun";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

const ROOT = join(import.meta.dir, "..");
dotenv.config({ path: join(ROOT, "apps/server/.env") });

const CLOUD_ROOT = "sycom-lms"; // mirrors @sycom/storage CLOUD_ROOT
const RESOURCE_TYPES = ["image", "video", "raw"] as const;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!cloudName || !apiKey || !apiSecret || !databaseUrl) {
  console.error("Missing CLOUDINARY_* or DATABASE_URL in apps/server/.env");
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

type CloudAsset = {
  publicId: string;
  resourceType: (typeof RESOURCE_TYPES)[number];
  type: string;
  bytes: number;
  format?: string;
  createdAt: string;
};

async function listCloudinaryAssets(): Promise<CloudAsset[]> {
  const assets: CloudAsset[] = [];
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
        assets.push({
          publicId: String(r.public_id),
          resourceType,
          type: String(r.type ?? "upload"),
          bytes: Number(r.bytes ?? 0),
          format: r.format ? String(r.format) : undefined,
          createdAt: String(r.created_at ?? ""),
        });
      }
      nextCursor = res.next_cursor as string | undefined;
    } while (nextCursor);
  }
  return assets;
}

/** Pull every string that looks like a Cloudinary reference out of arbitrary JSON. */
function collectRefStrings(value: unknown, out: Set<string>): void {
  if (typeof value === "string") {
    if (value.includes(`${CLOUD_ROOT}/`) || value.includes("res.cloudinary.com")) out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectRefStrings(v, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectRefStrings(v, out);
  }
}

/** Normalize a stored reference (bare public id or full URL) to a public id. */
function toPublicId(ref: string): string | null {
  if (ref.startsWith(`${CLOUD_ROOT}/`)) return stripVersion(ref);
  const m = ref.match(/res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/(.+)$/);
  if (m) return stripVersion(m[1]);
  return null;
}

function stripVersion(id: string): string {
  return id.replace(/^v\d+\//, "");
}

async function loadDbReferences(url: string, label: string) {
  const sql = new SQL(url);
  try {
    const registered = new Set<string>();
    const storageRows = (await sql`SELECT public_id FROM storage`) as Array<{ public_id: string }>;
    for (const r of storageRows) registered.add(r.public_id);

    // Content references across every table/column that can hold a public id.
    const refStrings = new Set<string>();
    const collect = (rows: Array<Record<string, unknown>>) => {
      for (const row of rows) for (const v of Object.values(row)) collectRefStrings(v, refStrings);
    };

    collect(await sql`SELECT content FROM lesson WHERE content IS NOT NULL`);
    collect(await sql`SELECT image_url, summary, certificate_settings FROM course`);
    collect(await sql`SELECT image FROM auth."user" WHERE image IS NOT NULL`);
    collect(await sql`SELECT logo FROM auth.organization WHERE logo IS NOT NULL`);
    collect(await sql`SELECT image_url FROM feedback_report WHERE image_url IS NOT NULL`);

    const referenced = new Set<string>();
    for (const ref of refStrings) {
      const pid = toPublicId(ref);
      if (pid) referenced.add(pid);
    }
    console.log(
      `  [db:${label}] storage rows: ${registered.size}, content refs: ${referenced.size}`,
    );
    return { registered, referenced };
  } finally {
    await sql.end();
  }
}

/** Audit against every DB sharing this Cloudinary cloud. An asset is only an
 *  orphan if unreferenced in ALL of them. Provide via AUDIT_DATABASE_URLS as
 *  `label=url[,label=url...]`; falls back to the single DATABASE_URL. */
function databaseTargets(): Array<{ label: string; url: string }> {
  const multi = process.env.AUDIT_DATABASE_URLS;
  if (multi) {
    return multi.split(",").map((part) => {
      const eq = part.indexOf("=");
      return eq === -1
        ? { label: "db", url: part.trim() }
        : { label: part.slice(0, eq).trim(), url: part.slice(eq + 1).trim() };
    });
  }
  return [{ label: "default", url: databaseUrl as string }];
}

function mb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** An asset counts as referenced if its public id (with or without extension) is referenced. */
function isReferenced(asset: CloudAsset, referenced: Set<string>): boolean {
  if (referenced.has(asset.publicId)) return true;
  const noExt = asset.publicId.replace(/\.[^./]+$/, "");
  if (referenced.has(noExt)) return true;
  if (asset.format && referenced.has(`${asset.publicId}.${asset.format}`)) return true;
  return false;
}

async function main() {
  console.log(`Cloud: ${cloudName} — scanning "${CLOUD_ROOT}/" (image, video, raw)…\n`);

  const targets = databaseTargets();
  console.log(`Databases sharing this cloud: ${targets.map((t) => t.label).join(", ")}`);
  const [assets, ...allRefs] = await Promise.all([
    listCloudinaryAssets(),
    ...targets.map((t) => loadDbReferences(t.url, t.label)),
  ]);
  console.log("");

  const registered = new Set<string>();
  const referenced = new Set<string>();
  for (const r of allRefs) {
    for (const id of r.registered) registered.add(id);
    for (const id of r.referenced) referenced.add(id);
  }

  const unregistered: CloudAsset[] = []; // bucket A — safe to delete
  const stale: CloudAsset[] = []; // bucket B — review

  for (const asset of assets) {
    const usedByContent = isReferenced(asset, referenced);
    const usedByStorage = registered.has(asset.publicId);
    if (usedByContent) continue; // referenced by live content — keep
    if (usedByStorage) {
      stale.push(asset); // in storage table but no content reference — review
    } else {
      unregistered.push(asset); // not referenced anywhere — safe to delete
    }
  }

  const sumBytes = (list: CloudAsset[]) => list.reduce((acc, a) => acc + a.bytes, 0);

  console.log(`Cloudinary assets under ${CLOUD_ROOT}/: ${assets.length}`);
  console.log(`Rows in storage table:               ${registered.size}`);
  console.log("");
  console.log(
    `A) UNREGISTERED orphans (safe):  ${unregistered.length}  (${mb(sumBytes(unregistered))})`,
  );
  console.log(`B) STALE registered (review):    ${stale.length}  (${mb(sumBytes(stale))})`);
  console.log("");

  if (unregistered.length) {
    console.log("── A) UNREGISTERED orphans — no storage row ───────────────────────");
    for (const a of unregistered) {
      console.log(`  [${a.resourceType}] ${a.publicId}  (${mb(a.bytes)}, ${a.createdAt})`);
    }
    console.log("");
  }

  if (stale.length) {
    console.log("── B) STALE registered — has storage row, not used by content ─────");
    for (const a of stale) {
      console.log(`  [${a.resourceType}] ${a.publicId}  (${mb(a.bytes)}, ${a.createdAt})`);
    }
    console.log("");
  }

  // Full machine-readable report.
  const reportPath = join(ROOT, "scripts/cloudinary-audit-report.json");
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        cloud: cloudName,
        scannedAt: new Date().toISOString(),
        totals: {
          cloudinaryAssets: assets.length,
          storageRows: registered.size,
          unregisteredOrphans: unregistered.length,
          unregisteredBytes: sumBytes(unregistered),
          staleRegistered: stale.length,
          staleBytes: sumBytes(stale),
        },
        unregisteredOrphans: unregistered,
        staleRegistered: stale,
      },
      null,
      2,
    ),
  );

  // Bucket A — truly unreferenced (no storage row, no content ref). Safe to delete.
  const orphansPath = join(ROOT, "scripts/cloudinary-delete-orphans.sh");
  writeFileSync(
    orphansPath,
    buildDeleteScript(unregistered, "unreferenced orphans (no storage row, no content reference)"),
    { mode: 0o755 },
  );

  // Bucket B — has a storage row but is not used by any content (re-upload
  // leftovers, superseded thumbnails/logos). Cloudinary delete + a SQL file to
  // remove the dangling storage rows. Review carefully before running.
  const stalePath = join(ROOT, "scripts/cloudinary-delete-stale.sh");
  writeFileSync(
    stalePath,
    buildDeleteScript(stale, "stale assets — has storage row but not referenced by any content"),
    { mode: 0o755 },
  );
  const staleSqlPath = join(ROOT, "scripts/cloudinary-delete-stale.sql");
  writeFileSync(staleSqlPath, buildStorageCleanupSql(stale));

  console.log(`Report written:   ${reportPath}`);
  console.log(`A) safe delete:   ${orphansPath}`);
  console.log(`B) stale delete:  ${stalePath}  (+ ${staleSqlPath} to clean storage rows)`);
}

function buildDeleteScript(orphans: CloudAsset[], description: string): string {
  const byType: Record<string, string[]> = {};
  for (const a of orphans) (byType[a.resourceType] ??= []).push(a.publicId);

  const lines: string[] = [
    "#!/usr/bin/env bash",
    "# AUTO-GENERATED by scripts/cloudinary-audit.ts — review before running.",
    `# Deletes: ${description}.`,
    "# Credentials are read from apps/server/.env; nothing is hardcoded here.",
    "set -euo pipefail",
    'ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"',
    'set -a; source "$ROOT/apps/server/.env"; set +a',
    'CLOUD="$CLOUDINARY_CLOUD_NAME"; KEY="$CLOUDINARY_API_KEY"; SECRET="$CLOUDINARY_API_SECRET"',
    "",
  ];

  if (orphans.length === 0) {
    lines.push('echo "Nothing to delete."', "");
    return lines.join("\n");
  }

  // Cloudinary Admin API deletes up to 100 public_ids per call.
  for (const [resourceType, ids] of Object.entries(byType)) {
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const dataArgs = batch.map(
        (id) => `  --data-urlencode 'public_ids[]=${id.replace(/'/g, "'\\''")}' \\`,
      );
      lines.push(
        `echo "Deleting ${batch.length} ${resourceType} asset(s)…"`,
        `curl -s -u "$KEY:$SECRET" -X DELETE \\`,
        `  "https://api.cloudinary.com/v1_1/$CLOUD/resources/${resourceType}/upload" \\`,
        `  --data-urlencode 'invalidate=true' \\`,
        ...dataArgs,
        `  ; echo`,
        "",
      );
    }
  }
  lines.push('echo "Done."', "");
  return lines.join("\n");
}

/** SQL to remove the dangling `storage` rows for bucket B (run on the DB(s)). */
function buildStorageCleanupSql(stale: CloudAsset[]): string {
  if (stale.length === 0) return "-- No stale storage rows to remove.\n";
  const values = stale.map((a) => `  '${a.publicId.replace(/'/g, "''")}'`).join(",\n");
  return [
    "-- AUTO-GENERATED by scripts/cloudinary-audit.ts — review before running.",
    "-- Removes storage rows whose Cloudinary asset is being deleted (bucket B).",
    "-- Run against EACH database that had these rows (prod, and dev if applicable).",
    "DELETE FROM storage WHERE public_id IN (",
    values,
    ");",
    "",
  ].join("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
