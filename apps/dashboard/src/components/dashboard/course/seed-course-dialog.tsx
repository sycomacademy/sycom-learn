import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC } from "@/lib/trpc/client";
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
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";

type SeedCourseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
};

export function SeedCourseDialog({
  courseId,
  courseTitle,
  onOpenChange,
  open,
}: SeedCourseDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const orgsQuery = useQuery({
    ...trpc.admin.listOrganizations.queryOptions({
      limit: 100,
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
    }),
    enabled: open,
  });

  const options: FilterOption[] = (orgsQuery.data?.rows ?? []).map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const seedMutation = useMutation({
    ...trpc.course.seed.mutationOptions({
      onSuccess: async ({ seeded }) => {
        toastManager.add({
          title: "Course seeded",
          description: `${courseTitle} was seeded into ${seeded.length} organization${seeded.length === 1 ? "" : "s"}.`,
          type: "success",
        });
        onOpenChange(false);
        setSelected([]);
        await queryClient.invalidateQueries({ queryKey: trpc.course.list.queryKey() });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't seed course",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setSelected([]);
  };

  const handleSeed = () => {
    if (selected.length === 0) return;
    seedMutation.mutate({ courseId, organizationIds: selected });
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seed course to organizations</DialogTitle>
          <DialogDescription>
            Each selected organization receives an independent draft copy of{" "}
            <strong>{courseTitle}</strong>. Future edits to the public course do <em>not</em>{" "}
            propagate.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {orgsQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner className="size-5" />
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organizations available.</p>
          ) : (
            <FilterCombobox
              allLabel="Pick organizations"
              label="Organizations"
              onValueChange={setSelected}
              options={options}
              resetWhenAllSelected={false}
              value={selected}
            />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {selected.length} organization{selected.length === 1 ? "" : "s"} selected.
          </p>
        </DialogPanel>
        <DialogFooter variant="bare">
          <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0}
            loading={seedMutation.isPending}
            onClick={handleSeed}
          >
            Seed to {selected.length || 0} org{selected.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
