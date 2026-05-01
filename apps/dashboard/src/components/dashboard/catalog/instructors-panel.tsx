import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { useTRPC } from "@/lib/trpc/client";
import { type InstructorRole } from "@sycom/db/schema/catalog";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Field, FieldLabel } from "@sycom/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";

type CourseDetail = AppRouterOutputs["catalog"]["get"];

const ROLE_LABELS: Record<InstructorRole, string> = {
  main: "Main",
  secondary: "Secondary",
};

export function InstructorsPanel({ course }: { course: CourseDetail }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.catalog.get.queryKey({ courseId: course.id }),
    });

  const removeMutation = useMutation({
    ...trpc.catalog.removeInstructor.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Instructor removed", type: "success" });
        await invalidate();
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't remove instructor",
          description: error.message,
          type: "error",
        }),
    }),
  });

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Instructors</h3>
          <Button onClick={() => setPickerOpen(true)} size="sm" variant="outline">
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {course.instructors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No instructors assigned yet.</p>
        ) : (
          <ul className="divide-y">
            {course.instructors.map((i) => (
              <li className="flex items-center gap-3 py-2" key={i.userId}>
                <Avatar className="size-8 rounded-full">
                  {i.image ? <AvatarImage alt={i.name} src={buildImageUrl(i.image)} /> : null}
                  <AvatarFallback className="text-xs">
                    {getInitials(i.name).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                </div>
                <Badge size="sm" variant={i.role === "main" ? "default" : "outline"}>
                  {ROLE_LABELS[i.role]}
                </Badge>
                <Button
                  aria-label={`Remove ${i.name}`}
                  loading={removeMutation.isPending}
                  onClick={() => removeMutation.mutate({ courseId: course.id, userId: i.userId })}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddInstructorDialog
        courseId={course.id}
        existingUserIds={course.instructors.map((i) => i.userId)}
        onOpenChange={setPickerOpen}
        open={pickerOpen}
      />
    </>
  );
}

function AddInstructorDialog({
  courseId,
  existingUserIds,
  onOpenChange,
  open,
}: {
  courseId: string;
  existingUserIds: string[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string>("");
  const [role, setRole] = useState<InstructorRole>("secondary");

  const usersQuery = useQuery({
    ...trpc.admin.listUsers.queryOptions({
      limit: 100,
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
      roles: ["platform_admin", "content_creator"],
    }),
    enabled: open,
  });

  const candidates = useMemo(
    () => (usersQuery.data?.rows ?? []).filter((u) => !existingUserIds.includes(u.id)),
    [usersQuery.data, existingUserIds],
  );

  const addMutation = useMutation({
    ...trpc.catalog.addInstructor.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Instructor added", type: "success" });
        onOpenChange(false);
        setUserId("");
        setRole("secondary");
        await queryClient.invalidateQueries({
          queryKey: trpc.catalog.get.queryKey({ courseId }),
        });
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't add instructor",
          description: error.message,
          type: "error",
        }),
    }),
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add instructor</DialogTitle>
          <DialogDescription>
            Pick a platform admin or content creator. Org members aren&apos;t shown — instructors
            are platform-level for public courses.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {usersQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner className="size-5" />
            </div>
          ) : (
            <div className="space-y-3">
              <Field>
                <FieldLabel>User</FieldLabel>
                <Select
                  onValueChange={(value) => setUserId(value ?? "")}
                  value={userId || undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No eligible users.
                      </div>
                    ) : (
                      candidates.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} — {u.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select onValueChange={(v) => setRole(v as InstructorRole)} value={role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}
        </DialogPanel>
        <DialogFooter variant="bare">
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!userId}
            loading={addMutation.isPending}
            onClick={() => addMutation.mutate({ courseId, userId, role })}
          >
            Add instructor
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
