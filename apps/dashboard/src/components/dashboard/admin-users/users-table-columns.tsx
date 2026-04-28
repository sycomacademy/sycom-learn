import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Button } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

export type AdminUsersListOutput = AppRouterOutputs["admin"]["listUsers"];
export type AdminUsersRow = AdminUsersListOutput["rows"][number];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const adminUsersColumns: ColumnDef<AdminUsersRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 rounded-md border border-border bg-muted/40 text-sm font-normal text-muted-foreground">
            <AvatarFallback className="rounded-md bg-transparent">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="block min-w-52 truncate text-sm text-muted-foreground">
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <InlineChip>{formatRole(row.original.role)}</InlineChip>,
  },
  {
    id: "organizations",
    header: "Organizations",
    cell: () => <span className="text-sm text-muted-foreground">No organizations</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusChip status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {dateFormatter.format(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => (
      <div className="flex justify-end">
        <Button aria-label="User actions" size="icon-sm" type="button" variant="ghost">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </div>
    ),
  },
];

function formatRole(role: AdminUsersRow["role"]) {
  if (role === "platform_admin") {
    return "Admin";
  }

  if (role === "content_creator") {
    return "Content Creator";
  }

  if (role === "public_student") {
    return "Student";
  }

  return "Unassigned";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InlineChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-border bg-background px-2.5 py-0.5 text-sm font-medium text-foreground">
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: AdminUsersRow["status"] }) {
  const statusConfig =
    status === "verified"
      ? { dot: "bg-success", label: "Active" }
      : status === "banned"
        ? { dot: "bg-destructive", label: "Banned" }
        : { dot: "bg-warning", label: "Unverified email" };

  return (
    <span className="inline-flex items-center gap-2 border border-border bg-background px-2.5 py-0.5 text-sm font-medium text-foreground">
      <span className={cn("size-2 rounded-full", statusConfig.dot)} />
      {statusConfig.label}
    </span>
  );
}
