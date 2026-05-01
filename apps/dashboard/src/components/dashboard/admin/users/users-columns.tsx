import type { UserRole } from "@sycom/db/schema/auth";
import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { formatDate } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { UserActions } from "./user-actions";
import { getUserInitials, getUserStatus, ROLE_LABELS, STATUS_CONFIG } from "./users-helpers";

export type UserRow = AppRouterOutputs["admin"]["listUsers"]["rows"][number];

function UserCell({ user }: { user: UserRow }) {
  return (
    <div className="flex max-w-72 min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
          {getUserInitials(user.name)}
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
      {ROLE_LABELS[role]}
    </Badge>
  );
}

function StatusBadge({ user }: { user: UserRow }) {
  const cfg = STATUS_CONFIG[getUserStatus(user)];
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
    cell: ({ row }) => formatDate(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <UserActions user={row.original} />,
    meta: { headerClassName: "w-10", className: "w-10 pe-2 text-end" },
  }),
];
