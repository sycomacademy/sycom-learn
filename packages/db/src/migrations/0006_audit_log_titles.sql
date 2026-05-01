-- Add event_title and event_subtitle columns (human-readable labels stored at write-time)
ALTER TABLE "audit_log" ADD COLUMN "event_title" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "event_subtitle" text NOT NULL DEFAULT '';--> statement-breakpoint
-- Drop entity columns replaced by the plugin-level payload in metadata
ALTER TABLE "audit_log" DROP COLUMN IF EXISTS "entity_type";--> statement-breakpoint
ALTER TABLE "audit_log" DROP COLUMN IF EXISTS "entity_id";--> statement-breakpoint
-- Drop the entity index (columns no longer exist)
DROP INDEX IF EXISTS "audit_log_entity_idx";
