import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BanIcon,
  EyeIcon,
  MoreHorizontalIcon,
  ShieldIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

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
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
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
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import type { UserRole } from "@sycom/db/schema/auth";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Admin",
  content_creator: "Content Creator",
  public_student: "Student",
};

const STATUS_CONFIG = {
  verified: { label: "Verified", variant: "success" },
  unverified: { label: "Unverified", variant: "warning" },
  banned: { label: "Banned", variant: "error" },
} as const;

const ROLE_OPTIONS = [
  { value: "platform_admin", label: ROLE_LABELS.platform_admin },
  { value: "content_creator", label: ROLE_LABELS.content_creator },
  { value: "public_student", label: ROLE_LABELS.public_student },
] as const;

const banUserSchema = z.object({
  banReason: z.string().check(z.minLength(1, "Ban reason is required"), z.maxLength(500)),
});

type BanUserInput = z.infer<typeof banUserSchema>;

const setUserRoleSchema = z.object({
  role: z.enum(["platform_admin", "content_creator", "public_student"]),
});

type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;

type UserRow = AppRouterOutputs["admin"]["listUsers"]["rows"][number];
type AdminUserDetails = AppRouterOutputs["admin"]["getUser"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function getStatus(user: Pick<UserRow, "banned" | "emailVerified">): keyof typeof STATUS_CONFIG {
  if (user.banned) return "banned";
  if (!user.emailVerified) return "unverified";
  return "verified";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function UserDetailsSheetContent({ user }: { user: AdminUserDetails }) {
  const status = STATUS_CONFIG[getStatus(user)];

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-4 pe-8">
          <Avatar className="size-12 rounded-md">
            {user.image ? <AvatarImage alt={user.name} src={buildImageUrl(user.image)} /> : null}
            <AvatarFallback className="rounded-md text-sm font-medium text-muted-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div>
              <SheetTitle>{user.name}</SheetTitle>
              <SheetDescription className="truncate">{user.email}</SheetDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline">{user.role ? ROLE_LABELS[user.role] : "No role"}</Badge>
              <Badge variant={user.twoFactorEnabled ? "success" : "secondary"}>
                2FA {user.twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>
      </SheetHeader>

      <SheetPanel>
        <dl>
          <DetailRow label="User ID" value={<span className="break-all">{user.id}</span>} />
          <DetailRow label="Joined" value={dateFormatter.format(user.createdAt)} />
          <DetailRow label="Updated" value={dateFormatter.format(user.updatedAt)} />
          <DetailRow label="Email verified" value={user.emailVerified ? "Yes" : "No"} />
          <DetailRow
            label="Accounts"
            value={user.accounts.length > 0 ? user.accounts.join(", ") : "None"}
          />
          <DetailRow
            label="Ban"
            value={
              user.banned ? (
                <div className="space-y-1">
                  <p>Banned</p>
                  <p className="text-muted-foreground">
                    Reason: {user.banReason ?? "Not provided"}
                  </p>
                  <p className="text-muted-foreground">
                    Expires: {user.banExpires ? dateFormatter.format(user.banExpires) : "Never"}
                  </p>
                </div>
              ) : (
                "Not banned"
              )
            }
          />
          <DetailRow
            label="Profile"
            value={
              user.profile ? (
                <div className="space-y-1">
                  <p>{user.profile.bio?.trim() ? user.profile.bio : "No bio"}</p>
                  <p className="text-muted-foreground">
                    Onboarded:{" "}
                    {user.profile.onboardedAt
                      ? dateFormatter.format(user.profile.onboardedAt)
                      : "No"}
                  </p>
                  <p className="break-all text-muted-foreground">
                    Settings: {JSON.stringify(user.profile.settings ?? {}, null, 0)}
                  </p>
                </div>
              ) : (
                "No profile"
              )
            }
          />
          <DetailRow
            label="Organizations"
            value={
              user.organizations.length > 0 ? (
                <div className="space-y-2">
                  {user.organizations.map((organization) => (
                    <div key={organization.id}>
                      <p>{organization.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {organization.role} since {dateFormatter.format(organization.joinedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                "No organizations"
              )
            }
          />
          <DetailRow
            label="Cohorts"
            value={
              user.cohorts.length > 0 ? (
                <div className="space-y-2">
                  {user.cohorts.map((cohort) => (
                    <div key={cohort.id}>
                      <p>{cohort.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cohort.organizationName} since {dateFormatter.format(cohort.joinedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                "No cohorts"
              )
            }
          />
        </dl>
      </SheetPanel>

      <SheetFooter variant="bare">
        <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
      </SheetFooter>
    </>
  );
}

export function UserActions({ user }: { user: UserRow }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data: { user: currentUser },
  } = useUser();
  const [viewOpen, setViewOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSelf = currentUser.id === user.id;
  const isTargetAdmin = user.role === "platform_admin";
  const currentRole = user.role ?? "public_student";
  const listUsersQueryKey = trpc.admin.listUsers.queryKey();
  const getUserQueryKey = trpc.admin.getUser.queryKey({ userId: user.id });

  const userDetailsQuery = useQuery({
    ...trpc.admin.getUser.queryOptions({ userId: user.id }),
    enabled: viewOpen,
  });

  const banForm = useForm<BanUserInput>({
    resolver: zodResolver(banUserSchema),
    defaultValues: { banReason: "" },
  });

  const roleForm = useForm<SetUserRoleInput>({
    resolver: zodResolver(setUserRoleSchema),
    defaultValues: { role: currentRole },
  });

  useEffect(() => {
    if (roleOpen) {
      roleForm.reset({ role: currentRole });
    }
  }, [currentRole, roleForm, roleOpen]);

  useEffect(() => {
    if (!banOpen) {
      banForm.reset({ banReason: "" });
    }
  }, [banForm, banOpen]);

  const invalidateUsers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: listUsersQueryKey }),
      queryClient.invalidateQueries({ queryKey: getUserQueryKey }),
    ]);
  };

  const banMutation = useMutation({
    ...trpc.admin.banUser.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "User banned",
          description: `${user.name} can no longer sign in.`,
          type: "success",
        });
        setBanOpen(false);
        await invalidateUsers();
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to ban user",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const setRoleMutation = useMutation({
    ...trpc.admin.setUserRole.mutationOptions({
      onSuccess: async (_data, input) => {
        toastManager.add({
          title: "Role updated",
          description: `${user.name} is now ${ROLE_LABELS[input.role]}.`,
          type: "success",
        });
        setRoleOpen(false);
        await invalidateUsers();
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to update role",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const impersonateMutation = useMutation({
    ...trpc.admin.impersonateUser.mutationOptions({
      onSuccess: () => {
        window.location.assign("/dashboard");
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to impersonate user",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const selectedRole = roleForm.watch("role");
  const canManageRole = !isSelf;
  const canBan = !isSelf;
  const canImpersonate = !isSelf && !isTargetAdmin;

  const onBanSubmit = async (data: BanUserInput) => {
    await banMutation.mutateAsync({ userId: user.id, banReason: data.banReason });
  };

  const onRoleSubmit = async (data: SetUserRoleInput) => {
    await setRoleMutation.mutateAsync({ userId: user.id, role: data.role });
  };

  const status = useMemo(() => STATUS_CONFIG[getStatus(user)], [user]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label={`Open actions for ${user.name}`} size="icon-sm" variant="ghost">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="min-w-0">
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setViewOpen(true)}>
              <UserRoundIcon />
              View user
            </DropdownMenuItem>
            {canManageRole ? (
              <DropdownMenuItem onClick={() => setRoleOpen(true)}>
                <ShieldIcon />
                Change role
              </DropdownMenuItem>
            ) : null}
            {canBan ? (
              <DropdownMenuItem onClick={() => setBanOpen(true)}>
                <BanIcon />
                Ban user
              </DropdownMenuItem>
            ) : null}
            {canImpersonate ? (
              <DropdownMenuItem onClick={() => setImpersonateOpen(true)}>
                <EyeIcon />
                Impersonate
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
            <Trash2Icon />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet onOpenChange={setViewOpen} open={viewOpen}>
        <SheetPopup>
          {userDetailsQuery.isLoading ? (
            <SheetPanel className="flex min-h-64 items-center justify-center">
              <Spinner className="size-5" />
            </SheetPanel>
          ) : userDetailsQuery.error ? (
            <>
              <SheetHeader>
                <SheetTitle>Couldn&apos;t load user</SheetTitle>
                <SheetDescription>{userDetailsQuery.error.message}</SheetDescription>
              </SheetHeader>
              <SheetFooter variant="bare">
                <Button onClick={() => userDetailsQuery.refetch()} variant="outline">
                  Retry
                </Button>
              </SheetFooter>
            </>
          ) : userDetailsQuery.data ? (
            <UserDetailsSheetContent user={userDetailsQuery.data} />
          ) : null}
        </SheetPopup>
      </Sheet>

      <Dialog onOpenChange={setRoleOpen} open={roleOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Update {user.name}&apos;s platform role. They are currently {ROLE_LABELS[currentRole]}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <Form {...roleForm}>
              <form className="space-y-4" onSubmit={roleForm.handleSubmit(onRoleSubmit)}>
                <FormField
                  control={roleForm.control}
                  name="role"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Role</FieldLabel>
                        <FormControl>
                          <Select
                            items={ROLE_OPTIONS.map((option) => ({
                              value: option.value,
                              label: option.label,
                            }))}
                            onValueChange={(value) => {
                              if (value) {
                                field.onChange(value);
                              }
                            }}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {ROLE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />
                <DialogFooter variant="bare">
                  <Button onClick={() => setRoleOpen(false)} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button
                    disabled={selectedRole === currentRole}
                    loading={roleForm.formState.isSubmitting}
                    type="submit"
                  >
                    Update role
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogPanel>
        </DialogPopup>
      </Dialog>

      <Dialog onOpenChange={setBanOpen} open={banOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Ban user</DialogTitle>
            <DialogDescription>
              This will prevent {user.name} from signing in and revoke their existing sessions.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <Form {...banForm}>
              <form className="space-y-4" onSubmit={banForm.handleSubmit(onBanSubmit)}>
                <FormField
                  control={banForm.control}
                  name="banReason"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Ban reason</FieldLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain why this account is being banned"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />
                <DialogFooter variant="bare">
                  <Button onClick={() => setBanOpen(false)} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button
                    loading={banForm.formState.isSubmitting}
                    type="submit"
                    variant="destructive"
                  >
                    Ban user
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogPanel>
        </DialogPopup>
      </Dialog>

      <Dialog onOpenChange={setImpersonateOpen} open={impersonateOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Impersonate user</DialogTitle>
            <DialogDescription>
              You will be signed in as {user.name}. You can stop impersonating from the account
              menu.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="rounded-none border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">{user.role ? ROLE_LABELS[user.role] : "No role"}</Badge>
              </div>
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button onClick={() => setImpersonateOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              loading={impersonateMutation.isPending}
              onClick={() => impersonateMutation.mutate({ userId: user.id })}
            >
              Impersonate user
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Delete behavior is not implemented yet while the team decides between hard and soft
              delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
            <AlertDialogClose
              render={<Button variant="destructive" />}
              onClick={() => {
                toastManager.add({
                  title: "Delete flow not implemented",
                  description: "No changes were made to this account.",
                  type: "info",
                });
              }}
            >
              Delete user
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
