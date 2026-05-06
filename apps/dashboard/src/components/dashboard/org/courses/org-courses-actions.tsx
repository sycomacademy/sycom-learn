import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { sessionQueryOptions } from "@/lib/auth/session";
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
import { Button } from "@sycom/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import { toastManager } from "@sycom/ui/components/toast";

import type { OrgCourseRow } from "./org-courses-schema";

function canTeacherDeleteOrgCourse(course: OrgCourseRow, userId: string) {
  if (course.createdBy === userId) {
    return true;
  }
  return course.instructors.some((i) => i.userId === userId && i.role === "main");
}

export function OrgCourseActions({ course }: { course: OrgCourseRow }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: auth } = useSuspenseQuery(sessionQueryOptions());
  const { data: workspace } = useSuspenseQuery(trpc.organization.workspaceContext.queryOptions());
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    ...trpc.orgCourse.delete.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Course deleted",
          description: `${course.title} was removed.`,
          type: "success",
        });
        setDeleteOpen(false);
        await queryClient.invalidateQueries({ queryKey: trpc.orgCourse.list.queryKey() });
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to delete course",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  if (!auth) {
    return null;
  }

  const memberRole = workspace.memberRole;
  const canDelete =
    memberRole === "owner" ||
    memberRole === "admin" ||
    (memberRole === "teacher" && canTeacherDeleteOrgCourse(course, auth.user.id));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label={`Open actions for ${course.title}`} size="icon-sm" variant="ghost">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() =>
              void navigate({
                to: "/dashboard/org/courses/$courseId",
                params: { courseId: course.id },
              })
            }
          >
            <PencilIcon />
            Edit course
          </DropdownMenuItem>
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
                <Trash2Icon />
                Delete course
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canDelete ? (
        <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete course</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes <strong>{course.title}</strong> and all of its sections and
                lessons for this organization.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
              <Button
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate({ courseId: course.id })}
                variant="destructive"
              >
                Delete course
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
