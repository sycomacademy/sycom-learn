import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { formatDate } from "@sycom/ui/lib/date";
import { getInitials } from "@sycom/ui/lib/string";
import { createColumnHelper } from "@tanstack/react-table";

import { OrgMemberActions } from "./org-member-actions";
import {
  getOrgMemberStatus,
  ORG_ROLE_LABELS,
  ORG_STATUS_CONFIG,
  type OrgMemberRow,
} from "./org-members-schema";

function MemberCell({ member }: { member: OrgMemberRow }) {
  return (
    <div className="flex max-w-72 min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        {member.image ? <AvatarImage alt={member.name} src={buildImageUrl(member.image)} /> : null}
        <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
    </div>
  );
}

function RolePill({ role }: { role: OrgMemberRow["role"] }) {
  return (
    <Badge className="rounded-md px-2 py-0.5 font-normal" size="default" variant="outline">
      {ORG_ROLE_LABELS[role]}
    </Badge>
  );
}

function StatusBadge({ member }: { member: OrgMemberRow }) {
  const cfg = ORG_STATUS_CONFIG[getOrgMemberStatus(member)];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function TwoFactorBadge({ member }: { member: OrgMemberRow }) {
  return member.twoFactorEnabled ? (
    <Badge variant="success">Enabled</Badge>
  ) : (
    <Badge variant="secondary">Disabled</Badge>
  );
}

function CohortsCell({ member }: { member: OrgMemberRow }) {
  if (member.cohorts.length === 0) {
    return <span className="text-xs text-muted-foreground">No cohorts</span>;
  }
  if (member.cohorts.length <= 2) {
    return <span className="text-xs">{member.cohorts.map((c) => c.name).join(", ")}</span>;
  }
  return (
    <span className="text-xs">
      {`${member.cohorts[0]?.name}, ${member.cohorts[1]?.name} +${member.cohorts.length - 2}`}
    </span>
  );
}

const columnHelper = createColumnHelper<OrgMemberRow>();

export const ORG_MEMBER_COLUMNS = [
  columnHelper.accessor("name", {
    id: "name",
    header: "Member",
    cell: ({ row }) => <MemberCell member={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("role", {
    id: "role",
    header: "Role",
    cell: ({ row }) => <RolePill role={row.original.role} />,
    enableSorting: false,
  }),
  columnHelper.display({
    id: "cohorts",
    header: "Cohorts",
    cell: ({ row }) => <CohortsCell member={row.original} />,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge member={row.original} />,
  }),
  columnHelper.display({
    id: "twoFactor",
    header: "2FA",
    cell: ({ row }) => <TwoFactorBadge member={row.original} />,
  }),
  columnHelper.accessor("joinedAt", {
    id: "joinedAt",
    header: "Joined",
    cell: ({ row }) => formatDate(row.original.joinedAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <OrgMemberActions member={row.original} />,
    meta: { headerClassName: "w-10", className: "w-10 pe-2 text-end" },
  }),
];
