import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontalIcon, PencilIcon, ShareIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";

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

import type { CourseRow } from "./courses-columns";
import { SeedCourseDialog } from "./seed-course-dialog";

export function CourseActions({ course }: { course: CourseRow }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [seedOpen, setSeedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    ...trpc.catalog.delete.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Course deleted",
          description: `${course.title} was removed from the catalog.`,
          type: "success",
        });
        setDeleteOpen(false);
        await queryClient.invalidateQueries({ queryKey: trpc.catalog.list.queryKey() });
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
                to: "/dashboard/admin/catalog/$courseId",
                params: { courseId: course.id },
              })
            }
          >
            <PencilIcon />
            Edit course
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSeedOpen(true)}>
            <ShareIcon />
            Seed to organization…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
            <Trash2Icon />
            Delete course
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SeedCourseDialog
        courseId={course.id}
        courseTitle={course.title}
        onOpenChange={setSeedOpen}
        open={seedOpen}
      />

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{course.title}</strong> and all of its sections and
              lessons. Organizations already seeded with this course are not affected.
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
    </>
  );
}
