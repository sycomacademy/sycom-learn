import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontalIcon, PencilIcon, SettingsIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { useTRPC } from "@/lib/trpc/client";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@sycom/ui/components/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import { toastManager } from "@sycom/ui/components/toast";
import { formatDate } from "@sycom/ui/lib/date";

import type { OrgCohortRow } from "./org-cohorts-schema";
import { RenameOrgCohortDialog } from "./rename-org-cohort-dialog";

export function OrgCohortListItem({ cohort }: { cohort: OrgCohortRow }): ReactNode {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: workspaceContext } = useSuspenseQuery(
    trpc.organization.workspaceContext.queryOptions(),
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const canManage =
    workspaceContext.memberRole === "owner" || workspaceContext.memberRole === "admin";

  const deleteMutation = useMutation({
    ...trpc.organization.deleteCohort.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Cohort deleted",
          description: `${cohort.name} was removed.`,
          type: "success",
        });
        setDeleteOpen(false);
        await queryClient.invalidateQueries({
          queryKey: trpc.organization.listCohorts.queryKey(),
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to delete cohort",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-medium">{cohort.name}</h3>
              <Badge variant="secondary">
                {cohort.memberCount} member{cohort.memberCount === 1 ? "" : "s"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Created {formatDate(cohort.createdAt)}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={`Open actions for ${cohort.name}`}
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() =>
                  void navigate({
                    to: "/dashboard/org/cohorts/$cohortId/courses",
                    params: { cohortId: cohort.id },
                  })
                }
              >
                <SettingsIcon />
                Manage cohort
              </DropdownMenuItem>
              {canManage ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    <PencilIcon />
                    Rename cohort
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
                    <Trash2Icon />
                    Delete cohort
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {canManage ? (
        <>
          <RenameOrgCohortDialog cohort={cohort} onOpenChange={setRenameOpen} open={renameOpen} />
          <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete cohort</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes <strong>{cohort.name}</strong> and removes all cohort
                  memberships.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
                <Button
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ cohortId: cohort.id })}
                  variant="destructive"
                >
                  Delete cohort
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </>
  );
}
