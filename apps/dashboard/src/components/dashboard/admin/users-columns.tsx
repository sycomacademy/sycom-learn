import { MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";

import type { DataTableColumn } from "@/components/dashboard/data-table";

export type UserRole = "platform_admin" | "content_creator" | "public_student";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole | null;
  emailVerified: boolean;
  banned: boolean;
  twoFactorEnabled: boolean;
  organizations: string[];
  createdAt: Date;
};

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

type Status = "active" | "unverified" | "banned";

function getStatus(user: UserRow): Status {
  if (user.banned) return "banned";
  if (!user.emailVerified) return "unverified";
  return "active";
}

const STATUS_CONFIG: Record<Status, { label: string; variant: "success" | "warning" | "error" }> = {
  active: { label: "Verified", variant: "success" },
  unverified: { label: "Unverified", variant: "warning" },
  banned: { label: "Banned", variant: "error" },
};

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

export const USER_COLUMNS: DataTableColumn<UserRow>[] = [
  {
    id: "user",
    header: "User",
    cell: (u) => <UserCell user={u} />,
  },
  {
    id: "role",
    header: "Role",
    cell: (u) => <RolePill role={u.role} />,
  },
  {
    id: "organizations",
    className: "text-muted-foreground",
    header: "Organizations",
    cell: (u) => <OrganizationsCell user={u} />,
  },
  {
    id: "status",
    header: "Status",
    cell: (u) => <StatusBadge user={u} />,
  },
  {
    id: "twoFactor",
    header: "2FA",
    cell: (u) => <TwoFactorBadge user={u} />,
  },
  {
    id: "joined",
    className: "text-muted-foreground",
    header: "Joined",
    cell: (u) => dateFormatter.format(u.createdAt),
  },
  {
    id: "actions",
    headerClassName: "w-10",
    className: "w-10 pe-2 text-end",
    header: "",
    cell: () => <RowActions />,
  },
];
