-- Transform sycom-lms data (already loaded into the _lms schema by
-- scripts/migrate-from-lms.sh) into the new sycom schema.
--
-- The whole script runs inside a single transaction (psql -1) so any
-- failure rolls back the destination state cleanly. Re-running is safe:
-- step 1 truncates the destination first, step 2 onwards re-populates.
--
-- Pre-condition: _lms schema exists and is fully populated (the
-- orchestrator handles that). Post-condition: _lms schema is dropped.

\set ON_ERROR_STOP on

BEGIN;

-- ===== 1. Wipe destination ===============================================
-- Order matters even with CASCADE so the truncate is comprehensible.

TRUNCATE
  public.lesson_progress,
  public.enrollment,
  public.course_instructor,
  public.course_category,
  public.lesson,
  public.section,
  public.course,
  public.category,
  public.profile,
  auth.cohort_member,
  auth.cohort,
  auth.invitation,
  auth.member,
  auth.organization,
  auth.account,
  auth."user"
RESTART IDENTITY CASCADE;

-- ===== 2. Fresh org + cohort for migrated users ==========================
-- Per the plan, we don't preserve the old org id. Everyone lands in one
-- new org and one new cohort under it.

INSERT INTO auth.organization (id, name, slug, created_at)
VALUES ('org_lms_migration', 'Sycom (migrated from LMS)', 'sycom-lms-migrated', now());

INSERT INTO auth.cohort (id, name, organization_id, created_at, updated_at)
VALUES ('cohort_lms_migration', 'Sycom LMS cohort', 'org_lms_migration', now(), now());

-- ===== 3. Users ==========================================================

INSERT INTO auth."user" (
  id, name, email, email_verified, image,
  created_at, updated_at, role,
  banned, ban_reason, ban_expires, two_factor_enabled
)
SELECT
  u.id, u.name, u.email, u.email_verified, u.image,
  u.created_at, u.updated_at,
  -- platform_role: platform_admin, content_creator, public_student
  CASE u.role
    WHEN 'platform_student' THEN 'public_student'
    WHEN 'content_creator'  THEN 'content_creator'
    WHEN 'platform_admin'   THEN 'platform_admin'
    ELSE 'public_student'
  END::auth.platform_role,
  COALESCE(u.banned, false),
  u.ban_reason,
  u.ban_expires,
  COALESCE(u.two_factor_enabled, false)
FROM _lms.user u;

-- ===== 4. Accounts (carries the password hash) ===========================

INSERT INTO auth.account (
  id, account_id, provider_id, user_id,
  access_token, refresh_token, id_token,
  access_token_expires_at, refresh_token_expires_at,
  scope, password, created_at, updated_at
)
SELECT
  id, account_id, provider_id, user_id,
  access_token, refresh_token, id_token,
  access_token_expires_at, refresh_token_expires_at,
  scope, password, created_at, updated_at
FROM _lms.account;

-- ===== 5. Members (re-attach to NEW org, remap role enum) ================

INSERT INTO auth.member (id, organization_id, user_id, role, created_at)
SELECT
  m.id,
  'org_lms_migration',
  m.user_id,
  CASE m.role
    WHEN 'org_owner'    THEN 'owner'
    WHEN 'org_admin'    THEN 'admin'
    WHEN 'org_auditor'  THEN 'admin'   -- no auditor in new enum, closest is admin
    WHEN 'org_teacher'  THEN 'teacher'
    WHEN 'org_student'  THEN 'student'
    ELSE 'student'
  END::auth.organization_role,
  m.created_at
FROM _lms.member m;

-- ===== 6. Cohort members (re-attach to NEW cohort) =======================

INSERT INTO auth.cohort_member (id, team_id, user_id, created_at)
SELECT id, 'cohort_lms_migration', user_id, created_at
FROM _lms.cohort_member;

-- ===== 7. Profiles (replicate the user.create.after hook) ================
-- The new app's hook in packages/auth/src/index.ts:110-119 inserts a
-- profile row for every newly-created user. Migrated users skipped that
-- hook, so we backfill here. Defaults handle bio/settings/timestamps.

INSERT INTO public.profile (user_id)
SELECT id FROM auth."user";

-- ===== 8. Content =========================================================

INSERT INTO public.category (id, name, slug, "order")
SELECT id, name, slug, COALESCE("order", 0) FROM _lms.category;

INSERT INTO public.course (
  id, organization_id, source_course_id,
  title, description, summary, slug, image_url,
  difficulty, status, created_by,
  created_at, updated_at, certificate_settings
)
SELECT
  c.id,
  'org_lms_migration',         -- attach to fresh org
  c.id,                        -- traceability: source course id == old course id
  c.title, c.description, c.summary, c.slug, c.image_url,
  c.difficulty, c.status, c.created_by,
  c.created_at, c.updated_at,
  NULL                         -- certificate_settings is new, no source data
FROM _lms.course c;

INSERT INTO public.course_category (course_id, category_id)
SELECT course_id, category_id FROM _lms.course_category;

INSERT INTO public.course_instructor (course_id, user_id, role, added_by, created_at)
SELECT course_id, user_id, role, added_by, created_at FROM _lms.course_instructor;

INSERT INTO public.section (
  id, course_id, title, description, "order",
  created_at, updated_at, open_at, due_at
)
SELECT
  id, course_id, title, description, "order",
  created_at, updated_at, NULL, NULL
FROM _lms.section;

INSERT INTO public.lesson (
  id, section_id, title, content, type, "order",
  created_at, updated_at, open_at, due_at
)
SELECT
  id, section_id, title, content, type, "order",
  created_at, updated_at, NULL, NULL
FROM _lms.lesson;

INSERT INTO public.enrollment (
  id, course_id, user_id, status,
  started_at, completed_at, last_activity_at,
  created_at, updated_at, access_source, granted_by_user_id
)
SELECT
  e.id, e.course_id, e.user_id, e.status,
  e.started_at, e.completed_at,
  -- derive last_activity_at from MAX(lesson_progress.started_at|completed_at)
  (
    SELECT GREATEST(MAX(lp.completed_at), MAX(lp.started_at))
    FROM _lms.lesson_progress lp
    WHERE lp.enrollment_id = e.id
  ),
  e.enrolled_at,                 -- map enrolled_at -> created_at
  e.enrolled_at,                 -- updated_at: best we have is enrolled_at
  CASE e.source
    WHEN 'org'    THEN 'org_grant'
    WHEN 'public' THEN 'free'
    WHEN 'paid'   THEN 'paid'
    ELSE 'free'
  END::enrollment_access_source,
  NULL
FROM _lms.enrollment e;

INSERT INTO public.lesson_progress (
  id, enrollment_id, lesson_id,
  status, started_at, completed_at, last_viewed_at,
  best_score, latest_score, attempt_count,
  created_at, updated_at,
  draft_answers, exam_integrity_events
)
SELECT
  id, enrollment_id, lesson_id,
  CASE
    WHEN completed_at IS NOT NULL THEN 'completed'
    WHEN started_at   IS NOT NULL THEN 'in_progress'
    ELSE 'not_started'
  END,
  started_at, completed_at,
  COALESCE(completed_at, started_at) AS last_viewed_at,
  NULL, NULL, 0,
  COALESCE(started_at, now()),
  COALESCE(completed_at, started_at, now()),
  NULL, NULL
FROM _lms.lesson_progress;

-- ===== 9. Drop staging ====================================================

DROP SCHEMA _lms CASCADE;

COMMIT;

-- ===== 10. Sanity SELECT (post-commit, read-only) ========================
\echo '\n=== Migration complete. Row counts: ==='
SELECT 'auth.user' AS t, COUNT(*) FROM auth."user"
UNION ALL SELECT 'auth.account', COUNT(*) FROM auth.account
UNION ALL SELECT 'auth.member', COUNT(*) FROM auth.member
UNION ALL SELECT 'auth.cohort_member', COUNT(*) FROM auth.cohort_member
UNION ALL SELECT 'public.profile', COUNT(*) FROM public.profile
UNION ALL SELECT 'public.course', COUNT(*) FROM public.course
UNION ALL SELECT 'public.section', COUNT(*) FROM public.section
UNION ALL SELECT 'public.lesson', COUNT(*) FROM public.lesson
UNION ALL SELECT 'public.enrollment', COUNT(*) FROM public.enrollment
UNION ALL SELECT 'public.lesson_progress', COUNT(*) FROM public.lesson_progress;
