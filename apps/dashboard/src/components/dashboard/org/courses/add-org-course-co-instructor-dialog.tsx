import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus2Icon } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import type { OrganizationRole } from "@sycom/db/schema/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@sycom/ui/components/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";

const ORG_ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

export function AddOrgCourseCoInstructorDialog({
  courseId,
  disabled,
}: {
  courseId: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: undefined,
    delayMs: 250,
    onDebouncedCommit: () => {},
  });

  const candidateQuery = useQuery({
    ...trpc.orgCourse.listAvailableCoInstructors.queryOptions({
      courseId,
      limit: 20,
      offset: 0,
      search: searchInput.trim() ? searchInput.trim() : undefined,
    }),
    enabled: open,
  });

  const candidates = useMemo(() => candidateQuery.data?.rows ?? [], [candidateQuery.data?.rows]);

  const handleAdd = async (userId: string) => {
    try {
      await trpcClient.orgCourse.addCoInstructor.mutate({ courseId, userId });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.orgCourse.listCoInstructors.queryKey({ courseId }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.orgCourse.listAvailableCoInstructors.queryKey(),
        }),
      ]);
      toastManager.add({ title: "Co-instructor added", type: "success" });
      setOpen(false);
      setSearchInput("");
    } catch (error) {
      toastManager.add({
        title: "Couldn't add co-instructor",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearchInput("");
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          <Button disabled={disabled} size="sm">
            <UserPlus2Icon className="size-4" />
            Add co-instructor
          </Button>
        }
      />
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add co-instructor</DialogTitle>
          <DialogDescription>
            Choose an organization admin or teacher. Courses can have up to 3 co-instructors.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <div className="space-y-4">
            <InputGroup className="w-full">
              <InputGroupAddon align="inline-start">
                {candidateQuery.isFetching ? (
                  <Spinner className="size-4" />
                ) : (
                  <Search className="size-4 opacity-60" />
                )}
              </InputGroupAddon>
              <InputGroupInput
                onChange={(event) => setSearchInput(event.currentTarget.value)}
                placeholder="Search by name or email..."
                type="search"
                value={searchInput}
              />
            </InputGroup>

            <div className="space-y-2">
              {candidates.length === 0 ? (
                <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                  No eligible users found.
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between gap-3 border px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-9 rounded-md">
                        {candidate.image ? (
                          <AvatarImage alt={candidate.name} src={buildImageUrl(candidate.image)} />
                        ) : null}
                        <AvatarFallback className="rounded-md text-xs text-muted-foreground">
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{candidate.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{candidate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ORG_ROLE_LABELS[candidate.organizationRole]}</Badge>
                      <Button
                        onClick={() => void handleAdd(candidate.id)}
                        size="sm"
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogPanel>

        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
