import { platformAc, platformRoles } from "@sycom/auth/permissions";
import type { UserRole } from "@sycom/db/schema/auth";
import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import { t } from "../t";

const platformRoleMap = {
  platform_admin: platformRoles.platform_admin,
  content_creator: platformRoles.content_creator,
  public_student: platformRoles.public_student,
} as const;

type Session = NonNullable<Context["session"]>;

type PermissionRequest<TStatements extends Record<string, readonly string[]>> = Partial<{
  [K in keyof TStatements]:
    | Array<TStatements[K][number]>
    | {
        actions: Array<TStatements[K][number]>;
        connector: "AND" | "OR";
      };
}>;

export type PlatformPermission = PermissionRequest<typeof platformAc.statements>;

function requireSession(session: Context["session"]): Session {
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }

  return session;
}

function getPlatformAccessRole(role: UserRole | null | undefined) {
  if (!role) {
    return null;
  }

  return platformRoleMap[role];
}

export function hasPlatformPermission(session: Context["session"], permission: PlatformPermission) {
  const currentSession = requireSession(session);
  const role = getPlatformAccessRole(currentSession.user.role as UserRole | null | undefined);

  if (!role) {
    return false;
  }

  return role.authorize(permission).success;
}

export function assertPlatformPermission(
  session: Context["session"],
  permission: PlatformPermission,
) {
  if (!hasPlatformPermission(session, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this resource",
    });
  }
}

export function platformPermissionMiddleware(permission: PlatformPermission) {
  return t.middleware(({ ctx, next }) => {
    assertPlatformPermission(ctx.session, permission);
    return next({ ctx: { ...ctx, session: requireSession(ctx.session) } });
  });
}
