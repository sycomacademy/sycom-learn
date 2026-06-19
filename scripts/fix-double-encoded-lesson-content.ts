/**
 * Repair lessons whose `content` jsonb was accidentally stored as a string
 * scalar (double-encoded JSON). Run once after a bad fix-lesson-asset-types run.
 *
 *   DATABASE_URL='postgres://…' bun run scripts/fix-double-encoded-lesson-content.ts          # dry-run
 *   DATABASE_URL='postgres://…' bun run scripts/fix-double-encoded-lesson-content.ts --apply
 */

import { join } from "node:path";
import { SQL } from "bun";
import dotenv from "dotenv";

const ROOT = join(import.meta.dir, "..");
dotenv.config({ path: join(ROOT, "apps/server/.env") });

const APPLY = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

async function main() {
  const sql = new SQL(databaseUrl);
  try {
    const rows = (await sql`
      SELECT id, content, jsonb_typeof(content) AS kind
      FROM lesson
      WHERE content IS NOT NULL AND jsonb_typeof(content) = 'string'
    `) as Array<{ id: string; content: string; kind: string }>;

    if (rows.length === 0) {
      console.log("No double-encoded lessons found.");
      return;
    }

    console.log(
      `Found ${rows.length} lesson(s) with string-scalar content. Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`,
    );
    for (const row of rows) {
      const inner = typeof row.content === "string" ? row.content : String(row.content);
      let parsed: unknown;
      try {
        parsed = JSON.parse(inner);
      } catch {
        console.warn(`  ! ${row.id}: inner JSON invalid — skipped`);
        continue;
      }
      const attachments = JSON.stringify(parsed).match(/"type":"fileAttachment"/g)?.length ?? 0;
      console.log(`  ${row.id}: ${attachments} fileAttachment node(s)`);

      if (APPLY) {
        await sql`
          UPDATE lesson SET content = ${parsed}, updated_at = now()
          WHERE id = ${row.id}
        `;
        console.log("    ✓ fixed");
      }
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
