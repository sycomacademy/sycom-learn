import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2Icon, CopyIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { useTRPC } from "@/lib/trpc/client";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@sycom/ui/components/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
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
  Sheet,
  SheetClose,
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

type OrganizationRow = AppRouterOutputs["admin"]["listOrganizations"]["rows"][number];
type AdminOrganizationDetails = AppRouterOutputs["admin"]["getOrganization"];
type AdminOrganizationMember = AdminOrganizationDetails["members"][number];

const ORG_ROLE_LABELS: Record<AdminOrganizationMember["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function MemberRow({ member }: { member: AdminOrganizationMember }) {
  return (
    <div className="flex items-start gap-3 rounded-md py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        {member.cohorts.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {member.cohorts.map((cohort) => (
              <Badge key={cohort.id} size="sm" variant="secondary">
                {cohort.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <Badge size="sm" variant={member.role === "owner" ? "default" : "outline"}>
        {ORG_ROLE_LABELS[member.role]}
      </Badge>
    </div>
  );
}

function OrganizationDetailsSheetContent({
  organization,
}: {
  organization: AdminOrganizationDetails;
}) {
  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-4 pe-8">
          <Avatar className="size-12 rounded-md">
            {organization.logo ? (
              <AvatarImage alt={organization.name} src={buildImageUrl(organization.logo)} />
            ) : null}
            <AvatarFallback className="rounded-md text-sm font-medium text-muted-foreground">
              {getInitials(organization.name).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div>
              <SheetTitle>{organization.name}</SheetTitle>
              <SheetDescription className="truncate">{organization.slug}</SheetDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {organization.memberCount} member{organization.memberCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline">
                {organization.cohortCount} cohort{organization.cohortCount === 1 ? "" : "s"}
              </Badge>
              {organization.pendingInviteCount > 0 ? (
                <Badge variant="secondary">
                  {organization.pendingInviteCount} pending invite
                  {organization.pendingInviteCount === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </SheetHeader>

      <SheetPanel>
        <dl>
          <DetailRow
            label="Organization ID"
            value={<span className="break-all">{organization.id}</span>}
          />
          <DetailRow label="Slug" value={organization.slug} />
          <DetailRow label="Created" value={formatDateTime(organization.createdAt)} />
          <DetailRow
            label="Owner"
            value={
              organization.owner ? (
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{organization.owner.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {organization.owner.email}
                    </p>
                  </div>
                </div>
              ) : (
                "No owner assigned"
              )
            }
          />
        </dl>

        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Members
            </h3>
            <span className="text-xs text-muted-foreground">{organization.memberCount}</span>
          </div>
          {organization.members.length > 0 ? (
            <div className="divide-y rounded-md border">
              {organization.members.map((member) => (
                <div className="px-3" key={member.id}>
                  <MemberRow member={member} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Cohorts
            </h3>
            <span className="text-xs text-muted-foreground">{organization.cohortCount}</span>
          </div>
          {organization.cohorts.length > 0 ? (
            <div className="divide-y rounded-md border">
              {organization.cohorts.map((cohort) => (
                <div className="flex items-center justify-between gap-3 px-3 py-2" key={cohort.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{cohort.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Created {formatDateTime(cohort.createdAt)}
                    </p>
                  </div>
                  <Badge size="sm" variant="outline">
                    {cohort.memberCount} member{cohort.memberCount === 1 ? "" : "s"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No cohorts yet.</p>
          )}
        </div>
      </SheetPanel>

      <SheetFooter variant="bare">
        <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
      </SheetFooter>
    </>
  );
}

type DeleteOrganizationDialogProps = {
  open: boolean;
  organization: OrganizationRow;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function DeleteOrganizationDialog({
  open,
  organization,
  isPending,
  onOpenChange,
  onConfirm,
}: DeleteOrganizationDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete organization</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <strong>{organization.name}</strong> ({organization.slug}) and
            cascades into its members, cohorts, and invitations. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <Button loading={isPending} onClick={onConfirm} variant="destructive">
            Delete organization
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function OrganizationActions({
  organization,
}: {
  organization: OrganizationRow;
}): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const listOrgsQueryKey = trpc.admin.listOrganizations.queryKey();

  const detailsQuery = useQuery({
    ...trpc.admin.getOrganization.queryOptions({ organizationId: organization.id }),
    enabled: viewOpen,
  });

  const deleteMutation = useMutation({
    ...trpc.admin.deleteOrganization.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Organization deleted",
          description: `${organization.name} has been permanently removed.`,
          type: "success",
        });
        setDeleteOpen(false);
        await queryClient.invalidateQueries({ queryKey: listOrgsQueryKey });
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to delete organization",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  async function handleCopySlug() {
    try {
      await navigator.clipboard.writeText(organization.slug);
      toastManager.add({
        title: "Slug copied",
        description: `${organization.slug} copied to your clipboard.`,
        type: "success",
      });
    } catch {
      toastManager.add({
        title: "Could not copy slug",
        description: "Try copying it manually from the table.",
        type: "error",
      });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`Open actions for ${organization.name}`}
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="min-w-0">
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">
                  {organization.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">{organization.slug}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => void handleCopySlug()}>
              <CopyIcon />
              Copy slug
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewOpen(true)}>
              <Building2Icon />
              View organization
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
            <Trash2Icon />
            Delete organization
          </DropdownMenuItem>
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
                <SheetTitle>Couldn&apos;t load organization</SheetTitle>
                <SheetDescription>{detailsQuery.error.message}</SheetDescription>
              </SheetHeader>
              <SheetFooter variant="bare">
                <Button onClick={() => detailsQuery.refetch()} variant="outline">
                  Retry
                </Button>
              </SheetFooter>
            </>
          ) : detailsQuery.data ? (
            <OrganizationDetailsSheetContent organization={detailsQuery.data} />
          ) : null}
        </SheetPopup>
      </Sheet>

      <DeleteOrganizationDialog
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ organizationId: organization.id })}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        organization={organization}
      />
    </>
  );
}
