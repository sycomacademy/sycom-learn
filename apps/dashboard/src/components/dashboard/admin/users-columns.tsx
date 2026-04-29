import type { UserRole } from "@sycom/db/schema/auth";
import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export type UserRow = AppRouterOutputs["admin"]["listUsers"]["rows"][number];

const ROLE_LABEL: Record<UserRole, string> = {
  platform_admin: "Admin",
  content_creator: "Content Creator",
  public_student: "Student",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserCell({ user }: { user: UserRow }) {
  return (
    <div className="flex max-w-72 min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}

function RolePill({ role }: { role: UserRole | null }) {
  if (role === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <Badge className="rounded-md px-2 py-0.5 font-normal" size="default" variant="outline">
      {ROLE_LABEL[role]}
    </Badge>
  );
}

const STATUS_CONFIG = {
  verified: { label: "Verified", variant: "success" },
  unverified: { label: "Unverified", variant: "warning" },
  banned: { label: "Banned", variant: "error" },
} as const;

function getStatus(user: UserRow): keyof typeof STATUS_CONFIG {
  if (user.banned) return "banned";
  if (!user.emailVerified) return "unverified";
  return "verified";
}

function StatusBadge({ user }: { user: UserRow }) {
  const cfg = STATUS_CONFIG[getStatus(user)];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function TwoFactorBadge({ user }: { user: UserRow }) {
  return user.twoFactorEnabled ? (
    <Badge variant="success">Enabled</Badge>
  ) : (
    <Badge variant="secondary">Disabled</Badge>
  );
}

function OrganizationsCell({ user }: { user: UserRow }) {
  if (user.organizations.length === 0) {
    return <span className="text-xs text-muted-foreground">No organizations</span>;
  }
  if (user.organizations.length === 1) {
    return <span className="text-xs">{user.organizations[0]}</span>;
  }
  return (
    <span className="text-xs">{`${user.organizations[0]} + ${user.organizations.length - 1}`}</span>
  );
}

function RowActions() {
  return (
    <Button aria-label="Row actions" size="icon-sm" variant="ghost">
      <MoreHorizontal className="size-4" />
    </Button>
  );
}

const columnHelper = createColumnHelper<UserRow>();

export const USER_COLUMNS = [
  columnHelper.accessor("name", {
    id: "name",
    header: "User",
    cell: ({ row }) => <UserCell user={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("role", {
    id: "role",
    header: "Role",
    cell: ({ row }) => <RolePill role={row.original.role} />,
    enableSorting: false,
  }),
  columnHelper.display({
    id: "organizations",
    header: "Organizations",
    cell: ({ row }) => <OrganizationsCell user={row.original} />,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge user={row.original} />,
  }),
  columnHelper.display({
    id: "twoFactor",
    header: "2FA",
    cell: ({ row }) => <TwoFactorBadge user={row.original} />,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "Joined",
    cell: ({ row }) => dateFormatter.format(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: () => <RowActions />,
    meta: { headerClassName: "w-10", className: "w-10 pe-2 text-end" },
  }),
];
