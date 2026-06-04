import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LayersIcon, MoreHorizontalIcon, UserMinusIcon, UserRoundIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@sycom/ui/components/alert-dialog";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import {
  SheetClose,
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@sycom/ui/components/sheet";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { formatDateTime } from "@sycom/ui/lib/date";
import { getInitials } from "@sycom/ui/lib/string";

import {
  getOrgMemberStatus,
  ORG_ROLE_LABELS,
  ORG_STATUS_CONFIG,
  type OrgMemberDetails,
  type OrgMemberRow,
} from "./org-members-schema";
import { OrgMemberStudentProfileSection } from "./org-member-student-profile-section";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function MemberDetailsSheetContent({ member }: { member: OrgMemberDetails }) {
  const status = ORG_STATUS_CONFIG[getOrgMemberStatus(member)];

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-4 pe-8">
          <Avatar className="size-12 rounded-md">
            {member.image ? (
              <AvatarImage alt={member.name} src={buildImageUrl(member.image)} />
            ) : null}
            <AvatarFallback className="rounded-md text-sm font-medium text-muted-foreground">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div>
              <SheetTitle>{member.name}</SheetTitle>
              <SheetDescription className="truncate">{member.email}</SheetDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline">{ORG_ROLE_LABELS[member.role]}</Badge>
              <Badge variant={member.twoFactorEnabled ? "success" : "secondary"}>
                2FA {member.twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>
      </SheetHeader>

      <SheetPanel>
        <dl>
          <DetailRow
            label="Member ID"
            value={<span className="break-all">{member.memberId}</span>}
          />
          <DetailRow label="User ID" value={<span className="break-all">{member.userId}</span>} />
          <DetailRow label="Joined" value={formatDateTime(member.joinedAt)} />
          <DetailRow label="Email verified" value={member.emailVerified ? "Yes" : "No"} />
          <DetailRow
            label="Cohorts"
            value={
              member.cohorts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {member.cohorts.map((c) => (
                    <Badge key={c.id} variant="secondary">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                "No cohorts"
              )
            }
          />
        </dl>
        <OrgMemberStudentProfileSection member={member} />
      </SheetPanel>

      <SheetFooter variant="bare">
        <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
      </SheetFooter>
    </>
  );
}

type RemoveMemberDialogProps = {
  open: boolean;
  member: OrgMemberRow;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function RemoveMemberDialog({
  open,
  member,
  isPending,
  onOpenChange,
  onConfirm,
}: RemoveMemberDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove member</AlertDialogTitle>
          <AlertDialogDescription>
            This removes <strong>{member.name}</strong> ({member.email}) from this organization.
            Their account is not deleted, and they can be re-invited later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <Button loading={isPending} onClick={onConfirm} variant="destructive">
            Remove member
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function OrgMemberActions({ member }: { member: OrgMemberRow }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data: { user: currentUser },
  } = useUser();
  const workspaceContext = useSuspenseQuery(trpc.organization.workspaceContext.queryOptions());
  const callerRole = workspaceContext.data.memberRole;

  const [viewOpen, setViewOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const isSelf = currentUser.id === member.userId;
  const targetIsOwner = member.role === "owner";
  const canRemove = !isSelf && (callerRole === "owner" || !targetIsOwner);

  const detailsQuery = useQuery({
    ...trpc.organization.getMember.queryOptions({ memberId: member.memberId }),
    enabled: viewOpen,
  });

  const removeMutation = useMutation({
    ...trpc.organization.removeMember.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Member removed",
          description: `${member.name} no longer belongs to this organization.`,
          type: "success",
        });
        setRemoveOpen(false);
        await queryClient.invalidateQueries({
          queryKey: trpc.organization.listMembers.queryKey(),
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to remove member",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label={`Open actions for ${member.name}`} size="icon-sm" variant="ghost">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="min-w-0">
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">{member.name}</span>
                <span className="truncate text-xs text-muted-foreground">{member.email}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setViewOpen(true)}>
              <UserRoundIcon />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <LayersIcon />
              Assign cohorts
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {canRemove ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRemoveOpen(true)} variant="destructive">
                <UserMinusIcon />
                Kick out
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet onOpenChange={setViewOpen} open={viewOpen}>
        <SheetPopup variant="inset">
          {detailsQuery.isLoading ? (
            <SheetPanel className="flex min-h-64 items-center justify-center">
              <Spinner className="size-5" />
            </SheetPanel>
          ) : detailsQuery.error ? (
            <>
              <SheetHeader>
                <SheetTitle>Couldn&apos;t load member</SheetTitle>
                <SheetDescription>{detailsQuery.error.message}</SheetDescription>
              </SheetHeader>
              <SheetFooter variant="bare">
                <Button onClick={() => detailsQuery.refetch()} variant="outline">
                  Retry
                </Button>
              </SheetFooter>
            </>
          ) : detailsQuery.data ? (
            <MemberDetailsSheetContent member={detailsQuery.data} />
          ) : null}
        </SheetPopup>
      </Sheet>

      <RemoveMemberDialog
        isPending={removeMutation.isPending}
        member={member}
        onConfirm={() => removeMutation.mutate({ memberId: member.memberId })}
        onOpenChange={setRemoveOpen}
        open={removeOpen}
      />
    </>
  );
}
