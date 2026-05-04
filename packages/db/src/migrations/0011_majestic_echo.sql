-- Legacy open_at / due_at were timestamp without time zone. Treat existing clock
-- values as UTC wall time when converting to timestamptz (matches JS Date → ISO writes).
ALTER TABLE "lesson" ALTER COLUMN "open_at" SET DATA TYPE timestamp with time zone USING ("open_at" AT TIME ZONE 'UTC');--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "due_at" SET DATA TYPE timestamp with time zone USING ("due_at" AT TIME ZONE 'UTC');--> statement-breakpoint
ALTER TABLE "section" ALTER COLUMN "open_at" SET DATA TYPE timestamp with time zone USING ("open_at" AT TIME ZONE 'UTC');--> statement-breakpoint
ALTER TABLE "section" ALTER COLUMN "due_at" SET DATA TYPE timestamp with time zone USING ("due_at" AT TIME ZONE 'UTC');
