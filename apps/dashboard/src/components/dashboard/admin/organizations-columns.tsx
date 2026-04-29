import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { formatDate } from "@sycom/ui/lib/date";
import { getInitials } from "@sycom/ui/lib/string";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { buildImageUrl } from "@sycom/ui/image/cdn";

import { OrganizationActions } from "./organizations-actions";

export type OrganizationRow = AppRouterOutputs["admin"]["listOrganizations"]["rows"][number];

function OrganizationCell({ organization }: { organization: OrganizationRow }) {
  return (
    <div className="flex max-w-72 min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        {organization.logo ? (
          <AvatarImage alt={organization.name} src={buildImageUrl(organization.logo)} />
        ) : null}
        <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
          {getInitials(organization.name).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{organization.name}</p>
        <p className="truncate text-xs text-muted-foreground">{organization.slug}</p>
      </div>
    </div>
  );
}

function MembersCell({ organization }: { organization: OrganizationRow }) {
  if (organization.memberCount === 0) {
    return <span className="text-xs text-muted-foreground">No members</span>;
  }

  const extraCount = Math.max(organization.memberCount - organization.members.length, 0);

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {organization.members.map((member) => (
          <Avatar className="size-7 rounded-full border-2 border-background" key={member.id}>
            {member.image ? (
              <AvatarImage alt={member.name} src={buildImageUrl(member.image)} />
            ) : null}
            <AvatarFallback className="text-[10px] font-medium text-muted-foreground">
              {getInitials(member.name).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {extraCount > 0 ? (
          <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
            +{extraCount}
          </div>
        ) : null}
      </div>
      <span className="text-xs text-muted-foreground">
        {organization.memberCount} member{organization.memberCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}

const columnHelper = createColumnHelper<OrganizationRow>();

export const ORGANIZATION_COLUMNS = [
  columnHelper.accessor("name", {
    id: "name",
    header: "Organization",
    cell: ({ row }) => <OrganizationCell organization={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("slug", {
    id: "slug",
    header: "Slug",
    cell: ({ row }) => row.original.slug,
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("memberCount", {
    id: "memberCount",
    header: "Members",
    cell: ({ row }) => <MembersCell organization={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <OrganizationActions organization={row.original} />,
    meta: { headerClassName: "w-10", className: "w-10 pe-2 text-end" },
  }),
];
