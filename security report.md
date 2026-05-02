# Security Report

## Scope

- TypeScript monorepo
- Frontend apps, backend APIs, shared packages, config files, CI/CD, environment handling, database access, auth flows, API routes, middleware, validation logic, and dependencies
- Focused on concrete, code-supported issues only

## Architecture Summary

- Monorepo uses Bun workspaces and Turborepo.
- Applications:
  - `apps/server`: Hono API server and Better Auth HTTP handler
  - `apps/dashboard`: authenticated TanStack Start dashboard
  - `apps/website`: public frontend
- Shared packages:
  - `packages/auth`: Better Auth configuration and auth plugins
  - `packages/db`: Drizzle ORM, Neon DB client, schemas, query modules
  - `packages/env`: typed server/web env validation
  - `packages/storage`: Cloudinary upload/sign/delete helpers
  - `packages/logger`, `packages/ui`, `packages/emails`, `packages/config`
- Main API entry points:
  - `/api/auth/*` from `apps/server/src/index.ts`
  - `/trpc/*` from `apps/server/src/index.ts`
  - `/health`
  - `/docs` in non-production only
- Session/auth flow:
  - Dashboard talks to server over HTTP with cookies.
  - Server resolves session with `auth.api.getSession()` in `apps/server/src/trpc/context.ts`.
  - tRPC protection is enforced centrally by `protectedProcedure` and `adminProcedure` middleware.
- Main attack surfaces:
  - tRPC routers, especially `storage`, `invite`, `admin`, `profile`, `feedback`
  - Better Auth endpoints
  - Cloudinary asset lifecycle flow
  - Audit logging and admin log viewer
  - Dependency and CI/CD workflow chain

## Findings

### 1. Arbitrary Asset Deletion By Any Authenticated User

- Severity: High
- OWASP category: A01 Broken Access Control
- File path and line number:
  - `apps/server/src/trpc/routers/storage.ts:83-102`
  - `packages/db/src/queries/storage.ts:25-30`
- Exact vulnerable code snippet:

```ts
delete: protectedProcedure.input(deleteAssetInputSchema).mutation(async ({ ctx, input }) => {
  const mutationInput: StorageDeleteAssetInput = input;

  await removeAsset(mutationInput.publicId, {
    resourceType: mutationInput.resourceType,
    invalidate: true,
  });

  const deleted = await deleteMediaAssetByPublicId(ctx.db, {
    publicId: mutationInput.publicId,
  });
```

```ts
.delete(storage)
.where(eq(storage.publicId, input.publicId))
```

- Why it is risky:
  - No ownership or authorization check is performed on the target `publicId`.
  - The Cloudinary asset is deleted before the server confirms the caller is allowed to delete it.
- Realistic exploitation scenario:
  - Any logged-in user who learns or guesses another asset `publicId` can delete another user's avatar, an organization logo, or course media.
- Recommended fix:
  - Resolve the asset row first.
  - Enforce ownership or admin/entity-level authorization.
  - Only delete from Cloudinary after authorization succeeds.
- Safer code example:

```ts
const asset = await findMediaAssetByPublicId(ctx.db, { publicId: input.publicId });
if (!asset) throw new TRPCError({ code: "NOT_FOUND" });

if (asset.uploadedBy !== ctx.session.user.id && ctx.session.user.role !== "platform_admin") {
  throw new TRPCError({ code: "FORBIDDEN" });
}

await removeAsset(asset.publicId, { resourceType: asset.resourceType, invalidate: true });
await deleteMediaAssetByPublicId(ctx.db, { publicId: asset.publicId });
```

- Confidence level: High

### 2. Arbitrary Signed Download URLs For Any Asset

- Severity: High
- OWASP category: A01 Broken Access Control
- File path and line number:
  - `apps/server/src/trpc/routers/storage.ts:74-80`
  - `apps/server/src/trpc/schemas.ts:390-395`
  - `packages/storage/src/cloudinary.ts:103-112`
- Exact vulnerable code snippet:

```ts
getSignedDownloadUrl: protectedProcedure.input(signedUrlInputSchema).query(({ input }) => {
  const queryInput: StorageSignedUrlInput = input;
  const url = getSignedUrl(queryInput.publicId, queryInput.expireIn, {
    download: queryInput.download,
    resourceType: queryInput.resourceType,
  });
  return { url, expiresIn: queryInput.expireIn };
}),
```

```ts
export const signedUrlInputSchema = z.object({
  publicId: z.string().min(1),
  expireIn: z.number().int().positive(),
  download: z.boolean().optional(),
  resourceType: z.enum(storageResourceTypeEnum.enumValues).optional(),
});
```

```ts
expires_at: Math.round(Date.now() / 1000) + expireIn,
```

- Why it is risky:
  - Any authenticated user can mint a signed URL for any asset if they know the `publicId`.
  - `expireIn` is unbounded, allowing very long-lived access links.
- Realistic exploitation scenario:
  - A low-privilege user obtains a `publicId` for private course or tenant media and generates a long-lived downloadable URL.
- Recommended fix:
  - Look up the asset row and enforce read authorization before signing.
  - Cap `expireIn` to a short server-side maximum.
- Safer code example:

```ts
const asset = await findMediaAssetByPublicId(ctx.db, { publicId: input.publicId });
if (!asset) throw new TRPCError({ code: "NOT_FOUND" });

assertCanReadAsset(ctx.session.user, asset);

const expiresIn = Math.min(input.expireIn, 300);
return { url: getSignedUrl(asset.publicId, expiresIn, { resourceType: asset.resourceType }) };
```

- Confidence level: High

### 3. Cross-Tenant Upload And Storage Metadata Tampering

- Severity: High
- OWASP category: A01 Broken Access Control
- File path and line number:
  - `apps/server/src/trpc/routers/storage.ts:24-33`
  - `apps/server/src/trpc/routers/storage.ts:36-62`
  - `packages/db/src/queries/storage.ts:6-22`
- Exact vulnerable code snippet:

```ts
signUpload: protectedProcedure.input(signUploadInputSchema).mutation(({ ctx, input }) => {
  return signUploadParams({
    folder: mutationInput.folder,
    entityType: mutationInput.entityType,
    entityId: mutationInput.entityId,
    uploaderId: ctx.session.user.id,
    uploaderEmail: ctx.session.user.email,
  });
}),
```

```ts
const expectedPrefix = `${buildAssetFolder(mutationInput.folder, mutationInput.entityId)}/`;

if (!mutationInput.publicId.startsWith(expectedPrefix)) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `publicId must live under ${CLOUD_ROOT}/${mutationInput.folder}/${mutationInput.entityId}/`,
  });
}

const row = await createMediaAsset(ctx.db, {
  publicId: mutationInput.publicId,
  ...
  entityType: mutationInput.entityType,
  entityId: mutationInput.entityId,
  uploadedBy: ctx.session.user.id,
});
```

```ts
.onConflictDoUpdate({
  target: storage.publicId,
  set: {
    secureUrl: input.secureUrl,
    bytes: input.bytes,
    width: input.width ?? null,
    height: input.height ?? null,
    tags: input.tags ?? [],
    updatedAt: new Date(),
  },
})
```

- Why it is risky:
  - The server trusts caller-provided `entityType`, `entityId`, and folder values.
  - No authorization ties the upload target to a resource the caller controls.
  - Existing storage metadata can be overwritten via `publicId` conflict.
- Realistic exploitation scenario:
  - A normal authenticated user signs an upload into another course or organization namespace and records the file as if it belongs there.
- Recommended fix:
  - Add entity-level authorization before signing uploads and saving assets.
  - Disallow upserts unless the current user already owns the asset or is authorized for the entity.
- Safer code example:

```ts
assertCanWriteEntity(ctx.session.user, {
  entityType: input.entityType,
  entityId: input.entityId,
  folder: input.folder,
});

const existing = await findMediaAssetByPublicId(ctx.db, { publicId: input.publicId });
if (existing && existing.uploadedBy !== ctx.session.user.id) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

- Confidence level: High

### 4. Revoked Session Tokens Are Persisted And Exposed To Admins

- Severity: High
- OWASP category: A02 Cryptographic Failures
- File path and line number:
  - `packages/auth/src/audit-plugin/server.ts:421-438`
  - `packages/db/src/queries/audit-log.ts:141-155`
  - `apps/dashboard/src/components/dashboard/admin/analytics/audit-log-detail-sheet.tsx:98-105`
- Exact vulnerable code snippet:

```ts
const payload = {
  userId: session.user.id,
  userName: session.user.name,
  revokedSessionToken: body.success ? body.data.token : undefined,
};
await write({
  ...
  metadata: payload,
});
```

```ts
metadata: row.log.metadata,
```

```tsx
<pre className="overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
  {JSON.stringify(row.metadata, null, 2)}
</pre>
```

- Why it is risky:
  - Session tokens are sensitive authentication artifacts.
  - They are stored in the database and rendered to admins in the dashboard.
- Realistic exploitation scenario:
  - An admin account compromise, DB read exposure, or exported audit log leak exposes valid or recently valid session tokens outside the auth system.
- Recommended fix:
  - Never persist raw session tokens.
  - Replace them with a hash or opaque identifier if correlation is needed.
  - Redact token-like fields before storage and display.
- Safer code example:

```ts
const payload = {
  userId: session.user.id,
  userName: session.user.name,
  revokedSessionId: body.success ? hashToken(body.data.token) : undefined,
};
```

- Confidence level: High

### 5. Reset And Invite Tokens Can Leak Into Logs Via Full URL Logging

- Severity: Medium
- OWASP category: A09 Security Logging and Monitoring Failures
- File path and line number:
  - `apps/dashboard/src/middleware/auth.ts:8-12`
  - `apps/dashboard/src/routes/accept-invite.tsx:12-18,31-39`
  - `apps/dashboard/src/routes/_auth/reset-password.tsx:26-29,45-49,64-71`
  - `apps/server/src/trpc/routers/admin.ts:67-74`
- Exact vulnerable code snippet:

```ts
startFnLogger.info("getSession request", {
  method: request.method,
  url: request.url,
});
```

```ts
const acceptInviteSearchSchema = z.object({
  token: z.optional(z.string()),
  kind: z.optional(z.literal("organization")),
});
```

```ts
const resetPasswordSearchSchema = z.object({
  token: z.optional(z.string()),
  error: z.optional(z.string()),
});
```

```ts
return `${dashboardUrl}/accept-invite?token=${token}`;
```

- Why it is risky:
  - Security-sensitive tokens are placed in query strings.
  - Full request URLs are logged in auth middleware.
- Realistic exploitation scenario:
  - Password reset or invitation tokens are captured in application logs or third-party log sinks and replayed before expiry.
- Recommended fix:
  - Stop logging full URLs.
  - Log path only, or explicitly redact query strings and known secret parameters.
  - Consider moving one-time tokens out of logged query strings where practical.
- Safer code example:

```ts
const { pathname } = new URL(request.url);
startFnLogger.info("getSession request", {
  method: request.method,
  path: pathname,
});
```

- Confidence level: High for the code path, Medium for production log exposure scope

### 6. Platform Invitation State Changes Are Raceable

- Severity: Medium
- OWASP category: A04 Insecure Design
- File path and line number:
  - `apps/server/src/trpc/routers/invite.ts:46-101`
  - `packages/db/src/queries/platform-invitations.ts:231-280`
  - `apps/server/src/trpc/routers/admin.ts:312-338`
- Exact vulnerable code snippet:

```ts
const invitation = await getPlatformInvitationByTokenHash(ctx.db, {
  tokenHash: hashInvitationToken(input.token),
});
...
const createdUser = await auth.api.createUser({ ... });

await markPlatformInvitationAccepted(ctx.db, {
  invitationId: invitation.id,
  acceptedUserId: createdUser.user.id,
});
```

```ts
.update(platform_invitation)
.set({
  status: "accepted",
  acceptedAt: new Date(),
  acceptedUserId: input.acceptedUserId,
  updatedAt: new Date(),
})
.where(eq(platform_invitation.id, input.invitationId))
```

```ts
await markPlatformInvitationRevoked(ctx.db, { invitationId: invitation.id });
```

- Why it is risky:
  - Accept, reject, and revoke are not finalized with a `pending` state guard.
  - Competing state transitions can overwrite each other.
- Realistic exploitation scenario:
  - An invite acceptance already in progress can still succeed after an admin revokes the invite.
- Recommended fix:
  - Make final updates conditional on `status = 'pending'`.
  - Treat zero updated rows as a conflict.
  - Prefer a transaction around user creation and invitation finalization.
- Safer code example:

```ts
const [row] = await database
  .update(platform_invitation)
  .set({ status: "accepted", acceptedUserId, acceptedAt: new Date() })
  .where(and(eq(platform_invitation.id, invitationId), eq(platform_invitation.status, "pending")))
  .returning();

if (!row) {
  throw new TRPCError({ code: "CONFLICT", message: "Invitation is no longer pending" });
}
```

- Confidence level: High

### 7. Dashboard Ships Dependencies With Known High-Severity Advisories

- Severity: Medium
- OWASP category: A06 Vulnerable and Outdated Components
- File path and line number:
  - `apps/dashboard/package.json:24-29,40,64`
  - Runtime evidence from `bun audit`
- Exact vulnerable code snippet:

```json
"@tanstack/react-start": "^1.167.57",
"@tanstack/router-plugin": "^1.167.31",
"nitro": "^3.0.0",
"vite": "^7.3.2"
```

- Why it is risky:
  - `bun audit` reported vulnerable transitive packages including:
    - `h3` high: middleware bypass and SSE injection
    - `srvx` moderate: middleware bypass via absolute URI
- Realistic exploitation scenario:
  - If the dashboard SSR runtime is deployed with these affected versions, request-routing or middleware protections may be bypassable depending on the exact upstream path.
- Recommended fix:
  - Upgrade the dashboard SSR dependency chain.
  - Re-run `bun audit` and validate the final resolved versions.
- Safer code example:

```bash
bun update @tanstack/react-start nitro vite
bun audit
```

- Confidence level: High on dependency presence, Medium on production exploitability without deployment validation

### 8. Write-Capable GitHub Action Uses Unpinned Third-Party Actions

- Severity: Medium
- OWASP category: A08 Software and Data Integrity Failures
- File path and line number:
  - `.github/workflows/update-deps.yml:8-10,16,18,38`
- Exact vulnerable code snippet:

```yaml
permissions:
  contents: write
  pull-requests: write
```

```yaml
- uses: actions/checkout@v4
- uses: oven-sh/setup-bun@v2
...
- uses: peter-evans/create-pull-request@v7
```

- Why it is risky:
  - Tag-based actions are mutable compared with full SHA pinning.
  - This workflow has write permissions and can create or update PRs.
- Realistic exploitation scenario:
  - If an upstream action tag is compromised, the workflow can execute attacker-controlled code with repository write access.
- Recommended fix:
  - Pin all actions to full commit SHAs.
  - Keep permissions minimal.
- Safer code example:

```yaml
permissions:
  contents: write
  pull-requests: write

steps:
  - uses: actions/checkout@<full-commit-sha>
  - uses: oven-sh/setup-bun@<full-commit-sha>
  - uses: peter-evans/create-pull-request@<full-commit-sha>
```

- Confidence level: High

## Additional Notes

- No concrete SQL injection was found in reviewed server/query code.
- No custom JWT verification flaw was found; auth is session-based through Better Auth.
- No `localStorage` or `sessionStorage` token storage was found.
- No concrete SSRF issue was confirmed in reviewed runtime code.
- No tracked Dockerfiles or `.dockerignore` files were present in the repository.
- Local `.env` files exist but are ignored and not tracked; this is an operational concern, not a confirmed repo leak.
- In-memory rate limiting exists and is better than nothing, but it is per-process and weaker in multi-instance deployments.

## Top 5 Most Urgent Fixes

1. Add authorization checks to `storage.delete`, `storage.getSignedDownloadUrl`, `storage.signUpload`, and `storage.saveAsset`.
2. Stop storing raw session tokens in audit metadata and purge or redact any existing exposed rows.
3. Remove query-string secrets from logs by logging path only.
4. Fix platform invitation state transitions to require `pending` and handle races transactionally.
5. Upgrade the dashboard SSR dependency chain flagged by `bun audit`, especially `h3` and `srvx`.

## Quick Wins

- Pin GitHub Actions to full SHAs.
- Add a strict max `expireIn` for signed download URLs.
- Gate dashboard devtools behind a development-only check.
- Add logger redaction for token-, cookie-, and password-like fields.

## Longer-Term Architectural Improvements

1. Centralize storage authorization into a single server-side policy layer keyed by `entityType` and `entityId`.
2. Treat Cloudinary `publicId` values as internal references, not as direct client authority.
3. Add structured secret redaction in the logger layer so future plugin/framework logs cannot leak sensitive fields.
4. Add PR CI for typecheck, tests, `bun audit`, secret scanning, and dependency/security checks.
5. Move security-sensitive one-time tokens away from logged query strings where practical.

## False Positives Or Areas Needing Manual Confirmation

- Production exposure of logged reset and invite URLs depends on deployed log sinks and retention.
- Runtime exploitability of the `h3` and `srvx` advisories depends on resolved production versions and reachable code paths.
- Security headers for `apps/dashboard` and `apps/website` at the edge or reverse proxy layer could not be verified from this repo alone.
- Cloud IAM, secret manager usage, branch protections, and deployment hardening are outside this repository and need manual confirmation.

## Final Security Score

- Score: 5/10
- Justification:
  - The codebase has several good baseline controls: typed env validation, centralized auth/session enforcement, CSRF, CORS allowlisting, secure cookie settings, and consistent server-side validation.
  - The score is reduced by three concrete high-severity broken-access-control issues in the storage subsystem, sensitive token exposure in audit and logging paths, and meaningful supply-chain/runtime weaknesses.

## Intended Follow-Up For Security Fix Agent

- Prioritize fixing the storage router and storage query authorization model first.
- Then remove sensitive token exposure from audit/logging.
- Then fix the invitation race condition.
- Finally, harden CI/dependencies and reduce the remaining exposure surface.
