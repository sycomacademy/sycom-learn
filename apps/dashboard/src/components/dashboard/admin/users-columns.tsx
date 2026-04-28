import { MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";

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
      <span className="min-w-0 truncate font-medium text-foreground">{user.name}</span>
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

const STATUS_CONFIG: Record<Status, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-emerald-500" },
  unverified: { label: "Unverified email", dot: "bg-amber-500" },
  banned: { label: "Banned", dot: "bg-destructive" },
};

function StatusIndicator({ user }: { user: UserRow }) {
  const cfg = STATUS_CONFIG[getStatus(user)];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-1.5 rounded-full", cfg.dot)} aria-hidden />
      <span>{cfg.label}</span>
    </span>
  );
}

function OrganizationsCell({ user }: { user: UserRow }) {
  if (user.organizations.length === 0) {
    return <span className="text-muted-foreground">No organizations</span>;
  }
  if (user.organizations.length === 1) {
    return <span>{user.organizations[0]}</span>;
  }
  return <span>{`${user.organizations[0]} + ${user.organizations.length - 1}`}</span>;
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
    header: "Name",
    cell: (u) => <UserCell user={u} />,
  },
  {
    id: "email",
    className: "max-w-xs min-w-48 truncate text-muted-foreground",
    header: "Email",
    cell: (u) => u.email,
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
    cell: (u) => <StatusIndicator user={u} />,
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
