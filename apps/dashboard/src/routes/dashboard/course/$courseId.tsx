import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, MoreHorizontalIcon, ShareIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { CategoriesPanel } from "@/components/dashboard/course/categories-panel";
import { EditCourseForm } from "@/components/dashboard/course/edit-course-form";
import { InstructorsPanel } from "@/components/dashboard/course/instructors-panel";
import { SeedCourseDialog } from "@/components/dashboard/course/seed-course-dialog";
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
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";

export const Route = createFileRoute("/dashboard/course/$courseId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.course.get.queryOptions({ courseId: params.courseId }),
    );
  },
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [seedOpen, setSeedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const query = useQuery(trpc.course.get.queryOptions({ courseId }));

  const deleteMutation = useMutation({
    ...trpc.course.delete.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Course deleted", type: "success" });
        await queryClient.invalidateQueries({ queryKey: trpc.course.list.queryKey() });
        await navigate({ to: "/dashboard/course" });
      },
      onError: (error) =>
        toastManager.add({
          title: "Failed to delete course",
          description: error.message,
          type: "error",
        }),
    }),
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-muted-foreground">
          {query.error?.message ?? "Course not found."}
        </p>
        <Button
          className="mt-3"
          onClick={() => void navigate({ to: "/dashboard/course" })}
          variant="outline"
        >
          <ArrowLeftIcon className="size-4" />
          Back to courses
        </Button>
      </div>
    );
  }

  const course = query.data;

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div>
        <button
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => void navigate({ to: "/dashboard/course" })}
          type="button"
        >
          <ArrowLeftIcon className="size-3" />
          Back to courses
        </button>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold">{course.title}</h1>
              <Badge size="sm" variant={course.status === "published" ? "default" : "secondary"}>
                {course.status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{course.slug}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button aria-label="Course actions" size="icon" variant="outline">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Metadata</h2>
          <EditCourseForm course={course} />
        </div>
        <div className="space-y-4">
          <InstructorsPanel course={course} />
          <CategoriesPanel course={course} />
        </div>
      </div>

      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium">
          {course.sections.length === 0
            ? "0 sections"
            : `${course.sections.length} section${course.sections.length === 1 ? "" : "s"}`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Content editor (sections + lessons authoring) ships next sprint.
        </p>
      </div>

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
    </div>
  );
}
