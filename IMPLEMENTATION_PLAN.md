# Sycom LMS — Implementation Plan

Multi-tenant cybersecurity Learning Management System built on an existing Turborepo monorepo template.

---

## Current State

The template already provides:

- **Monorepo**: Turborepo + Bun, three apps (`server`, `dashboard`, `website`), six packages (`db`, `auth`, `trpc`, `env`, `ui`, `config`)
- **Auth**: Better Auth with email/password, Drizzle adapter, session management. Tables: `user`, `session`, `account`, `verification`
- **API**: tRPC with `publicProcedure` and `protectedProcedure`. Context resolves session from headers via Better Auth
- **Database**: Drizzle ORM + Neon serverless Postgres. Example `todo` schema exists
- **UI**: Shared shadcn/ui (base-lyra style) with button, card, input, label, checkbox, dropdown-menu, skeleton, sonner
- **Server**: Hono with CORS, logger, Better Auth mounted at `/api/auth/*`, tRPC at `/trpc/*`
- **Dashboard**: React 19 + TanStack Router + React Query. Has login/signup forms, auth guard, theme toggle, user menu
- **Website**: Static React 19 + TanStack Router. No auth, no API calls
- **Env**: Type-safe validation via `@t3-oss/env-core`. Server vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`. Web vars: `VITE_SERVER_URL`
- **Tooling**: Oxlint + Oxfmt, Lefthook pre-commit hook

## Target Architecture

### Hosting

| Subdomain | App | Host |
|---|---|---|
| `learn.sycomsolutions.com` | Website (marketing/SEO) | Azure Static Web App #1 |
| `app.learn.sycomsolutions.com` | Dashboard (all users) | Azure Static Web App #2 |
| `api.learn.sycomsolutions.com` | Hono server | Azure Container Apps |

DNS records configured in Hostinger. No wildcard subdomains for now — tenants are resolved after login via org membership, not URLs.

### Multi-Tenancy Model

Single login at `app.learn.sycomsolutions.com/login`. After auth:
- 0 orgs → onboarding (create org or enter invite code)
- 1 org → auto-redirect to org dashboard
- 2+ orgs → org picker screen

Users join tenants via **invite links** (not email domain matching). A user can belong to multiple orgs with different roles in each.

A special "public" org exists for the open course catalog that any user can auto-join to on signup.

---

## Phase 1: Multi-Tenancy Foundation

### 1.1 — Install Better Auth Organization Plugin

Better Auth has a built-in `organization` plugin that handles orgs, members, invites, and roles. Use it instead of building from scratch.

**File: `packages/auth/src/index.ts`**
- Add the `organization` plugin to the Better Auth config
- Configure roles: `owner`, `admin`, `instructor`, `learner`
- Enable invitation support

**File: `apps/dashboard/src/lib/auth-client.ts`**
- Add the organization client plugin to the Better Auth client

**Reference**: https://www.better-auth.com/docs/plugins/organization

The plugin auto-creates these tables (via Better Auth's Drizzle adapter):
- `organization` — id, name, slug, logo, metadata, createdAt
- `member` — id, organizationId, userId, role, createdAt
- `invitation` — id, organizationId, email, role, status, inviterId, expiresAt

Run `bunx @better-auth/cli generate` then `bun run db:push` to sync the schema.

### 1.2 — Org Context in tRPC

**File: `packages/trpc/src/context.ts`**
- After resolving the session, also read the active `orgId` from a request header (e.g., `x-org-id`)
- Validate that the user is a member of that org
- Add `orgId` and `orgRole` to the tRPC context

```ts
// Pseudocode for new context shape
type Context = {
  session: Session | null
  org: { id: string; role: "owner" | "admin" | "instructor" | "learner" } | null
}
```

**Files: `apps/server/src/trpc/init.ts`**, **`apps/server/src/trpc/middleware/`** (add org/role-gated procedures here or in dedicated middleware modules)
- Create a new `orgProcedure` that extends `protectedProcedure` and enforces `ctx.org` is not null
- Create role-gated procedures: `instructorProcedure`, `adminProcedure`

### 1.3 — Dashboard Org State

**File: `apps/dashboard/src/utils/trpc.ts`**
- Read the active orgId from app state (React context or URL param) and send it as the `x-org-id` header on every tRPC request

**New file: `apps/dashboard/src/components/org-switcher.tsx`**
- Dropdown in the header showing current org, listing all user's orgs
- Calls Better Auth's `organization.list()` client method
- On switch, updates app state and refetches queries

**New file: `apps/dashboard/src/routes/select-org.tsx`**
- Full-page org picker shown after login when user has 2+ orgs
- "Create new organization" option at the bottom

### 1.4 — Invite Flow

**New file: `apps/dashboard/src/routes/invite.$token.tsx`**
- Route that handles invite link clicks
- If logged in → accept invite, redirect to org dashboard
- If not logged in → redirect to signup, then accept invite after account creation

**tRPC routers to add (`apps/server/src/trpc/routers/org.ts`)**:
- `org.create` — admin procedure, creates org
- `org.invite` — admin procedure, sends invite (creates invitation record + sends email)
- `org.acceptInvite` — protected procedure, accepts an invite token
- `org.members` — org procedure, lists members with roles
- `org.updateRole` — admin procedure, change member's role
- `org.removeMember` — admin procedure, remove a member

### 1.5 — Public Org (Seed)

Create a database seed script that creates a special organization:
- slug: `public`
- name: `Sycom Public`
- Flagged as the default org (add a `isDefault` boolean column or use env var `PUBLIC_ORG_ID`)

On user signup (via Better Auth hook or tRPC middleware), auto-add the new user as a `learner` member of the public org.

---

## Phase 2: Core LMS Schema

All tables below are tenant-scoped (have an `organizationId` foreign key). All queries filter by the active org from context.

### 2.1 — Schema Files

**New file: `packages/db/src/schema/course.ts`**

```
course
  id              text PK (nanoid or cuid)
  organizationId  text FK → organization.id
  title           text NOT NULL
  slug            text NOT NULL
  description     text
  coverImage      text (URL)
  difficulty      enum: beginner | intermediate | advanced | expert
  status          enum: draft | published | archived
  createdBy       text FK → user.id
  createdAt       timestamp
  updatedAt       timestamp
  UNIQUE(organizationId, slug)
```

**New file: `packages/db/src/schema/module.ts`**

```
module
  id              text PK
  courseId         text FK → course.id (CASCADE delete)
  title           text NOT NULL
  description     text
  order           integer NOT NULL
  createdAt       timestamp
  updatedAt       timestamp

lesson
  id              text PK
  moduleId        text FK → module.id (CASCADE delete)
  title           text NOT NULL
  type            enum: video | text | quiz | lab
  content         jsonb (rich content — markdown, video URL, quiz config, lab config)
  durationMinutes integer
  order           integer NOT NULL
  createdAt       timestamp
  updatedAt       timestamp
```

**New file: `packages/db/src/schema/enrollment.ts`**

```
enrollment
  id              text PK
  courseId         text FK → course.id
  userId          text FK → user.id
  organizationId  text FK → organization.id
  status          enum: active | completed | dropped
  enrolledAt      timestamp
  completedAt     timestamp
  UNIQUE(courseId, userId, organizationId)

lesson_progress
  id              text PK
  lessonId        text FK → lesson.id
  userId          text FK → user.id
  enrollmentId    text FK → enrollment.id
  status          enum: not_started | in_progress | completed
  completedAt     timestamp
  UNIQUE(lessonId, userId)
```

**New file: `packages/db/src/schema/assessment.ts`**

```
assessment
  id              text PK
  lessonId        text FK → lesson.id (one-to-one for quiz-type lessons)
  title           text NOT NULL
  passingScore    integer (percentage, e.g., 70)
  maxAttempts     integer (null = unlimited)
  timeLimitMinutes integer (null = no limit)
  questions       jsonb (array of question objects)
  createdAt       timestamp

assessment_attempt
  id              text PK
  assessmentId    text FK → assessment.id
  userId          text FK → user.id
  score           integer
  passed          boolean
  answers         jsonb
  startedAt       timestamp
  completedAt     timestamp
```

**New file: `packages/db/src/schema/certificate.ts`**

```
certificate
  id              text PK
  courseId         text FK → course.id
  userId          text FK → user.id
  organizationId  text FK → organization.id
  issuedAt        timestamp
  verificationCode text UNIQUE (short UUID for public verification)
```

**Update: `packages/db/src/schema/index.ts`**
- Export all new schemas

### 2.2 — Remove Todo (Cleanup)

- Delete `packages/db/src/schema/todo.ts`
- Delete `apps/server/src/trpc/routers/todo.ts`
- Remove todo router from `apps/server/src/trpc/routers/_app.ts`
- Delete `apps/dashboard/src/routes/todos.tsx`
- Remove Todos link from dashboard header

---

## Phase 3: Course Management (Instructor/Admin)

### 3.1 — tRPC Routers

**New file: `apps/server/src/trpc/routers/course.ts`**
- `course.list` — orgProcedure, list courses for current org. Support filters: status, difficulty, search text. For learners, only show `published`. For instructors/admins, show all
- `course.getBySlug` — orgProcedure, get single course with modules and lessons
- `course.create` — instructorProcedure, create course (draft status)
- `course.update` — instructorProcedure, update course details
- `course.publish` — instructorProcedure, change status draft→published
- `course.archive` — adminProcedure, change status→archived
- `course.delete` — adminProcedure, soft or hard delete

**New file: `apps/server/src/trpc/routers/module.ts`**
- `module.list` — orgProcedure, list modules for a course (ordered)
- `module.create` — instructorProcedure
- `module.update` — instructorProcedure
- `module.reorder` — instructorProcedure, accepts array of `{id, order}`
- `module.delete` — instructorProcedure

**New file: `apps/server/src/trpc/routers/lesson.ts`**
- `lesson.get` — orgProcedure, get lesson with content
- `lesson.create` — instructorProcedure
- `lesson.update` — instructorProcedure
- `lesson.reorder` — instructorProcedure
- `lesson.delete` — instructorProcedure

### 3.2 — Dashboard: Course Builder UI

**New routes in `apps/dashboard/src/routes/`:**

```
routes/
  courses/
    index.tsx              — Course catalog/list (role-aware)
    $courseSlug/
      index.tsx            — Course overview (syllabus view)
      edit.tsx             — Course settings (title, description, cover, difficulty)
      modules/
        index.tsx          — Module/lesson tree editor (drag-to-reorder)
        $moduleId/
          $lessonId.tsx    — Lesson content editor
```

**Course builder features:**
- Rich text editor for text lessons (use Tiptap or MDXEditor — pick one, add to `@sycom/ui` or dashboard-local)
- Video lessons: URL input (YouTube/Vimeo embed or direct URL). File upload is Phase 6
- Quiz lessons: JSON-based question builder UI (multiple choice, true/false, fill-in-the-blank)
- Lab lessons: placeholder config for Phase 7

---

## Phase 4: Learner Experience

### 4.1 — tRPC Routers

**New file: `apps/server/src/trpc/routers/enrollment.ts`**
- `enrollment.enroll` — orgProcedure (learner), enroll in a published course
- `enrollment.drop` — orgProcedure, drop enrollment
- `enrollment.myCourses` — orgProcedure, list user's enrollments with progress percentage
- `enrollment.courseProgress` — orgProcedure, detailed progress for one enrollment

**New file: `apps/server/src/trpc/routers/progress.ts`**
- `progress.markComplete` — orgProcedure, mark a lesson as completed
- `progress.getLessonStatus` — orgProcedure, get status for a lesson

**New file: `apps/server/src/trpc/routers/assessment.ts`**
- `assessment.start` — orgProcedure, create a new attempt (enforce maxAttempts)
- `assessment.submit` — orgProcedure, submit answers, auto-grade, return score
- `assessment.getAttempts` — orgProcedure, list user's attempts for an assessment

### 4.2 — Dashboard: Learner UI

**New/updated routes:**

```
routes/
  dashboard.tsx            — Rewrite: show enrolled courses with progress bars, recent activity
  courses/
    $courseSlug/
      learn/
        index.tsx          — Course player: sidebar with module/lesson tree, main content area
        $lessonId.tsx      — Individual lesson viewer:
                              - Text: rendered markdown/HTML
                              - Video: embedded player
                              - Quiz: interactive assessment UI
                              - Lab: placeholder launcher
```

**Key UI components to build:**
- `course-card.tsx` — Card showing title, cover, difficulty badge, progress bar
- `course-sidebar.tsx` — Collapsible module/lesson navigation with completion checkmarks
- `lesson-viewer.tsx` — Renders lesson content by type
- `quiz-player.tsx` — Steps through questions, submits, shows results
- `progress-ring.tsx` — Circular progress indicator

### 4.3 — Auto-completion Logic

When all lessons in a course are marked complete (and all quizzes passed), auto-update enrollment status to `completed` and generate a certificate record. This logic lives in the `progress.markComplete` mutation as a side effect.

---

## Phase 5: Certificates

### 5.1 — Certificate Generation

**New file: `apps/server/src/trpc/routers/certificate.ts`**
- `certificate.getMyCertificates` — orgProcedure, list user's certificates
- `certificate.verify` — publicProcedure, look up by verificationCode (public endpoint for verification)

### 5.2 — Certificate UI

**New route: `apps/dashboard/src/routes/certificates/index.tsx`**
- List of earned certificates with download button

**New route: `apps/website/src/routes/verify.$code.tsx`**
- Public certificate verification page on the website (no auth needed)
- Shows: learner name, course title, org name, issue date, "Verified" badge

**Certificate PDF generation:**
- Use a library like `@react-pdf/renderer` to generate downloadable PDF certificates
- Or generate server-side with a template and return as a file from a Hono route

---

## Phase 6: File Storage & Media

### 6.1 — Storage Setup

Add Azure Blob Storage (since you're already on Azure) or Cloudflare R2. Create a new package or add to server:

**New file: `apps/server/src/trpc/routers/upload.ts`**
- `upload.getPresignedUrl` — instructorProcedure, returns a presigned upload URL for the client to upload directly to blob storage
- Store the resulting URL in the lesson content JSON

**Use cases:**
- Course cover images
- Video files (if self-hosting instead of YouTube/Vimeo)
- PDF/document attachments for lessons
- Lab configuration files

### 6.2 — Env Update

**File: `packages/env/src/server.ts`**
- Add `AZURE_STORAGE_CONNECTION_STRING` or equivalent storage credentials

---

## Phase 7: Cybersecurity-Specific Features

This is the differentiating phase. Implement incrementally.

### 7.1 — Skill Paths

**New schema: `packages/db/src/schema/skill-path.ts`**

```
skill_path
  id              text PK
  organizationId  text FK → organization.id
  title           text (e.g., "SOC Analyst", "Penetration Tester")
  description     text
  slug            text
  order           integer
  UNIQUE(organizationId, slug)

skill_path_course (join table)
  skillPathId     text FK → skill_path.id
  courseId        text FK → course.id
  order           integer
```

**Router: `apps/server/src/trpc/routers/skill-path.ts`**
- CRUD for skill paths (admin/instructor)
- Assign/reorder courses within a path
- Learner progress across a full path

**UI: `apps/dashboard/src/routes/paths/`**
- Path catalog view
- Path detail view showing course sequence with overall progress

### 7.2 — CTF Challenges

**New schema: `packages/db/src/schema/ctf.ts`**

```
ctf_challenge
  id              text PK
  courseId         text FK → course.id (optional — can be standalone or part of a course)
  organizationId  text FK → organization.id
  title           text
  description     text (the challenge brief)
  category        enum: web | crypto | forensics | reverse | pwn | misc
  difficulty      enum: easy | medium | hard | insane
  points          integer
  flag            text (hashed — never sent to client)
  hints           jsonb (array of { text, cost })
  maxAttempts     integer
  createdAt       timestamp

ctf_submission
  id              text PK
  challengeId     text FK → ctf_challenge.id
  userId          text FK → user.id
  submittedFlag   text
  correct         boolean
  submittedAt     timestamp

ctf_leaderboard (materialized view or computed)
  userId          text
  organizationId  text
  totalPoints     integer
  solveCount      integer
  rank            integer
```

**Router: `apps/server/src/trpc/routers/ctf.ts`**
- `ctf.list` — list challenges (hide flags)
- `ctf.submit` — validate flag (hash comparison), record submission
- `ctf.leaderboard` — computed ranking for the org
- `ctf.create` / `ctf.update` / `ctf.delete` — instructor procedures

**UI:**
- Challenge list with category/difficulty filters
- Challenge detail with flag submission input
- Leaderboard table

### 7.3 — Hands-On Labs (Complex — Do Last)

Labs are the hardest feature. Options in order of complexity:

**Option A: External Lab Provider (Recommended for v1)**
- Integrate with a service like TryHackMe, HackTheBox, or Cyber Ranges via their API
- Lesson content stores the lab URL/config
- "Launch Lab" button opens in new tab or iframe
- Completion callback or polling to sync status

**Option B: Container-Based Labs (Self-hosted)**
- Each lab is a Docker Compose config
- Server provisions containers on demand (Azure Container Instances)
- User gets a web terminal (via ttyd or wetty) proxied through the server
- Auto-teardown after timeout
- Requires significant infrastructure work: container orchestration, networking, security isolation, cost management

**Option C: Browser-Based Simulations**
- WebAssembly-based terminal emulators
- Pre-built scenarios with scripted responses
- Limited realism but zero infrastructure cost

**Recommendation:** Start with Option A or static lab instructions (PDFs/guides with VM download links). Build Option B as a separate initiative once the core LMS is stable.

### 7.4 — Compliance/Framework Tagging

**New schema: `packages/db/src/schema/tag.ts`**

```
framework
  id              text PK
  name            text (e.g., "MITRE ATT&CK", "NIST CSF", "CompTIA Security+")

framework_tag
  id              text PK
  frameworkId     text FK → framework.id
  code            text (e.g., "T1059", "PR.AC-1", "1.1")
  label           text

course_tag (join table)
  courseId         text FK → course.id
  tagId           text FK → framework_tag.id
```

This lets instructors tag courses/lessons with framework objectives, and learners can filter courses by compliance framework or see which objectives they've covered.

---

## Phase 8: Analytics & Admin Dashboard

### 8.1 — Analytics Router

**New file: `apps/server/src/trpc/routers/analytics.ts`**
- `analytics.orgOverview` — adminProcedure: total users, active learners, courses, enrollments, completion rate
- `analytics.courseStats` — instructorProcedure: per-course enrollment count, avg progress, avg quiz score, completion rate
- `analytics.learnerReport` — adminProcedure: per-user progress across all courses, activity timeline
- `analytics.assessmentStats` — instructorProcedure: per-assessment pass rate, avg score, attempt distribution

### 8.2 — Admin UI

**New routes:**

```
routes/
  admin/
    index.tsx              — Org overview dashboard with key metrics
    members.tsx            — Member management (invite, role change, remove)
    settings.tsx           — Org settings (name, logo, branding)
    analytics/
      index.tsx            — Charts: enrollment trends, completion rates over time
      courses.tsx          — Per-course performance table
      learners.tsx         — Per-learner progress table
```

**Chart library:** Use Recharts (already common with shadcn) for bar charts, line charts, and pie charts.

---

## Phase 9: Notifications & Email

### 9.1 — Transactional Email

Add a transactional email service (Resend, Postmark, or Azure Communication Services).

**Emails to send:**
- Org invitation
- Welcome after signup
- Course enrollment confirmation
- Certificate earned
- (Optional) Weekly progress digest

**New package or add to server:**
- Email templates (React Email or simple HTML)
- Send function called from tRPC mutations

### 9.2 — In-App Notifications

**New schema: `packages/db/src/schema/notification.ts`**

```
notification
  id              text PK
  userId          text FK → user.id
  organizationId  text FK → organization.id
  type            enum: invite | enrollment | certificate | announcement
  title           text
  body            text
  read            boolean default false
  createdAt       timestamp
```

**UI:** Bell icon in header with unread count badge + notification dropdown.

---

## Phase 10: Billing (Optional / Future)

### 10.1 — Stripe Integration

- Per-org subscription plans (free tier, pro, enterprise)
- Seat-based pricing or flat rate
- Stripe Customer Portal for self-service billing management
- Webhook handler on the Hono server for subscription events

**New env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`

This phase is intentionally last — you can run without billing initially (manual onboarding) and add it when you have paying customers.

---

## Deployment & Infrastructure

### Azure Container Apps (Server)

1. Create a Dockerfile for `apps/server`:
   ```dockerfile
   FROM oven/bun:1 AS base
   WORKDIR /app
   COPY . .
   RUN bun install --frozen-lockfile
   RUN bun run build -F server
   CMD ["bun", "run", "apps/server/dist/index.js"]
   ```
2. Push to Azure Container Registry (ACR)
3. Create Container App with:
   - Ingress: external, port 3000
   - Custom domain: `api.learn.sycomsolutions.com`
   - Env vars from Azure Key Vault or Container App secrets
   - Min replicas: 1, max: 5 (scale on HTTP concurrency)

### Azure Static Web Apps (Frontends)

1. Connect each ASWA to the GitHub repo
2. Configure build:
   - Website: app location `apps/website`, output `dist`
   - Dashboard: app location `apps/dashboard`, output `dist`
3. Add custom domains in ASWA settings
4. Set `VITE_SERVER_URL=https://api.learn.sycomsolutions.com` as build-time env var for dashboard

### DNS (Hostinger)

```
learn.sycomsolutions.com           CNAME → <website-aswa>.azurestaticapps.net
app.learn.sycomsolutions.com       CNAME → <dashboard-aswa>.azurestaticapps.net
api.learn.sycomsolutions.com       CNAME → <container-app>.azurecontainerapps.io
```

### CI/CD

Set up GitHub Actions (or Azure DevOps):
- On push to `main`: build + deploy server container, build + deploy both frontends
- Use Turborepo's `--affected` flag to only rebuild what changed
- Run `bun run check-types` and `bun run check` as CI gates

---

## Recommended Build Order

| Phase | What | Depends On | Estimated Scope |
|-------|------|-----------|-----------------|
| 1 | Multi-tenancy (org plugin, context, org switcher) | Nothing | Foundation — do first |
| 2 | LMS schema (courses, modules, lessons, enrollments) | Phase 1 | Data model |
| 3 | Course builder (instructor CRUD + editor UI) | Phase 2 | First real feature |
| 4 | Learner experience (catalog, player, progress) | Phase 2 | Core user-facing flow |
| 5 | Certificates | Phase 4 | Small, high-value |
| 6 | File storage | Phase 3 | Enables rich content |
| 7 | Cyber features (paths, CTF, labs, tags) | Phase 4 | Differentiator |
| 8 | Analytics | Phase 4 | Admin value |
| 9 | Email & notifications | Phase 1 | Polish |
| 10 | Billing | Phase 8 | Monetization |

**Do Phases 1–4 before anything else.** That gives you a functional multi-tenant LMS. Everything after is incremental value.

---

## Key Decisions for the Implementer

1. **ID generation**: Use `nanoid` or `cuid2` for all primary keys (not auto-increment integers — better for distributed systems and URLs)
2. **Rich text editor**: Pick Tiptap (more flexible) or MDXEditor (markdown-native). Add as a dashboard-local dependency, not to `@sycom/ui`
3. **File storage**: Azure Blob Storage is the natural choice given Azure hosting. Use presigned URLs for direct client uploads
4. **Email service**: Resend is the simplest to set up. Add `RESEND_API_KEY` to env
5. **Chart library**: Recharts works well with shadcn's style system
6. **Lab strategy**: Start with external links or static guides. Container-based labs are a separate project
7. **Delete the todo schema/routes/UI** — it's template scaffolding, not needed

## Files to Reference

- Auth config: `packages/auth/src/index.ts`
- DB connection + schema exports: `packages/db/src/index.ts`, `packages/db/src/schema/`
- tRPC context: `packages/trpc/src/context.ts`
- tRPC root router: `apps/server/src/trpc/routers/_app.ts`
- Procedure definitions: `apps/server/src/trpc/init.ts`, `apps/server/src/trpc/middleware/require-session.ts`
- Server entry: `apps/server/src/index.ts`
- Dashboard tRPC client: `apps/dashboard/src/utils/trpc.ts`
- Dashboard auth client: `apps/dashboard/src/lib/auth-client.ts`
- Dashboard routes: `apps/dashboard/src/routes/`
- Env validation: `packages/env/src/server.ts`, `packages/env/src/web.ts`
- Shared UI: `packages/ui/src/components/`
- CLAUDE.md: project commands and conventions
