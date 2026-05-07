-- Stage tables on the destination DB to receive a pg_dump of sycom-lms.
--
-- We deliberately use TEXT for every column that's an enum in old prod.
-- That way a pg_dump-produced COPY stream restores cleanly here without
-- needing to recreate the old enum types, and the transform step can cast
-- TEXT -> the new enums where needed.
--
-- Names mirror the old schema 1:1 (auth.X / public.X) but flattened into
-- the _lms schema. The orchestrator sed-rewrites COPY targets accordingly.

DROP SCHEMA IF EXISTS _lms CASCADE;
CREATE SCHEMA _lms;

-- ===== auth ===============================================================

CREATE TABLE _lms.user (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  two_factor_enabled boolean DEFAULT false,
  role text,                           -- old platform_role enum
  banned boolean DEFAULT false,
  ban_reason text,
  ban_expires timestamp
);

CREATE TABLE _lms.account (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamp,
  refresh_token_expires_at timestamp,
  scope text,
  password text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE _lms.organization (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  logo text,
  created_at timestamp NOT NULL DEFAULT now(),
  metadata text
);

CREATE TABLE _lms.member (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL,                  -- old organization_role enum
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE _lms.cohort (
  id text PRIMARY KEY,
  name text NOT NULL,
  organization_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  image text
);

CREATE TABLE _lms.cohort_member (
  id text PRIMARY KEY,
  team_id text NOT NULL,
  user_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE _lms.invitation (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  email text NOT NULL,
  role text,
  team_id text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  inviter_id text NOT NULL
);

-- ===== public =============================================================

CREATE TABLE _lms.profile (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  bio text DEFAULT '',
  settings jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE _lms.category (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  "order" integer DEFAULT 0
);

CREATE TABLE _lms.course (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  summary jsonb,
  slug text NOT NULL,
  image_url text,
  difficulty text NOT NULL DEFAULT 'beginner',
  estimated_duration integer,
  status text NOT NULL DEFAULT 'draft',
  created_by text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE _lms.course_category (
  course_id text NOT NULL,
  category_id text NOT NULL,
  PRIMARY KEY (course_id, category_id)
);

CREATE TABLE _lms.course_instructor (
  course_id text NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'secondary',
  added_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, user_id)
);

CREATE TABLE _lms.section (
  id text PRIMARY KEY,
  course_id text NOT NULL,
  title text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE _lms.lesson (
  id text PRIMARY KEY,
  section_id text NOT NULL,
  title text NOT NULL,
  content jsonb,
  type text NOT NULL DEFAULT 'article',
  "order" integer NOT NULL DEFAULT 0,
  estimated_duration integer,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE _lms.enrollment (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  course_id text NOT NULL,
  enrolled_at timestamp NOT NULL DEFAULT now(),
  completed_at timestamp,
  organization_id text NOT NULL,
  source text NOT NULL DEFAULT 'public',
  status text NOT NULL DEFAULT 'active',
  started_at timestamp,
  cohort_id text NOT NULL
);

CREATE TABLE _lms.lesson_progress (
  id text PRIMARY KEY,
  enrollment_id text NOT NULL,
  lesson_id text NOT NULL,
  started_at timestamp NOT NULL DEFAULT now(),
  completed_at timestamp
);
