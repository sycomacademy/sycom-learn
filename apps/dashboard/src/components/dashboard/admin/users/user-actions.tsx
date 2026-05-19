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
import { useReducer, type ReactNode } from "react";
import { useForm } from "react-hook-form";
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
import { formatDateTime } from "@sycom/ui/lib/date";
import type { UserRole } from "@sycom/db/schema/auth";
import { getInitials } from "@sycom/ui/lib/string";
import type { UserRow, SetUserRoleInput, BanUserInput, UserStatus } from "./users-schema";
import {
  getUserStatus,
  banUserSchema,
  setUserRoleSchema,
  ROLE_LABELS,
  ROLE_OPTIONS,
  STATUS_CONFIG,
  type AdminUserDetails,
} from "./users-schema";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function UserDetailsSheetContent({ user }: { user: AdminUserDetails }) {
  const status = STATUS_CONFIG[getUserStatus(user)];

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-4 pe-8">
          <Avatar className="size-12 rounded-md">
            {user.image ? <AvatarImage alt={user.name} src={buildImageUrl(user.image)} /> : null}
            <AvatarFallback className="rounded-md text-sm font-medium text-muted-foreground">
              {getInitials(user.name)}
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
          <DetailRow label="Joined" value={formatDateTime(user.createdAt)} />
          <DetailRow label="Updated" value={formatDateTime(user.updatedAt)} />
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
                    Expires: {user.banExpires ? formatDateTime(user.banExpires) : "Never"}
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
                    {user.profile.onboardedAt ? formatDateTime(user.profile.onboardedAt) : "No"}
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
                        {organization.role} since {formatDateTime(organization.joinedAt)}
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
                        {cohort.organizationName} since {formatDateTime(cohort.joinedAt)}
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

type UserActionsMenuProps = {
  user: UserRow;
  canManageRole: boolean;
  canBan: boolean;
  canImpersonate: boolean;
  canDelete: boolean;
  onView: () => void;
  onChangeRole: () => void;
  onBanToggle: () => void;
  onImpersonate: () => void;
  onDelete: () => void;
};

type UserDialogKey = "viewOpen" | "banOpen" | "roleOpen" | "impersonateOpen" | "deleteOpen";

type UserDialogsState = Record<UserDialogKey, boolean>;

type UserDialogsAction = {
  type: "set";
  dialog: UserDialogKey;
  open: boolean;
};

const initialUserDialogsState: UserDialogsState = {
  viewOpen: false,
  banOpen: false,
  roleOpen: false,
  impersonateOpen: false,
  deleteOpen: false,
};

function userDialogsReducer(state: UserDialogsState, action: UserDialogsAction): UserDialogsState {
  switch (action.type) {
    case "set":
      return { ...state, [action.dialog]: action.open };
  }
}

function UserActionsMenu({
  user,
  canManageRole,
  canBan,
  canImpersonate,
  canDelete,
  onView,
  onChangeRole,
  onBanToggle,
  onImpersonate,
  onDelete,
}: UserActionsMenuProps) {
  return (
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
          <DropdownMenuItem onClick={onView}>
            <UserRoundIcon />
            View user
          </DropdownMenuItem>
          {canManageRole ? (
            <DropdownMenuItem onClick={onChangeRole}>
              <ShieldIcon />
              Change role
            </DropdownMenuItem>
          ) : null}
          {canBan ? (
            <DropdownMenuItem onClick={onBanToggle}>
              <BanIcon />
              {user.banned ? "Unban user" : "Ban user"}
            </DropdownMenuItem>
          ) : null}
          {canImpersonate ? (
            <DropdownMenuItem onClick={onImpersonate}>
              <EyeIcon />
              Impersonate
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash2Icon />
              Delete user
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ChangeRoleDialogProps = {
  open: boolean;
  user: UserRow;
  currentRole: UserRole;
  selectedRole: UserRole;
  roleForm: ReturnType<typeof useForm<SetUserRoleInput>>;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSubmit: (data: SetUserRoleInput) => Promise<void>;
};

function ChangeRoleDialog({
  open,
  user,
  currentRole,
  selectedRole,
  roleForm,
  onOpenChange,
  onCancel,
  onSubmit,
}: ChangeRoleDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update {user.name}&apos;s platform role. They are currently {ROLE_LABELS[currentRole]}.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form {...roleForm}>
            <form className="space-y-4" onSubmit={roleForm.handleSubmit(onSubmit)}>
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
                <Button onClick={onCancel} type="button" variant="outline">
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
  );
}

type BanUserDialogProps = {
  open: boolean;
  user: UserRow;
  banForm: ReturnType<typeof useForm<BanUserInput>>;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSubmit: (data: BanUserInput) => Promise<void>;
};

function BanUserDialog({
  open,
  user,
  banForm,
  onOpenChange,
  onCancel,
  onSubmit,
}: BanUserDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Ban user</DialogTitle>
          <DialogDescription>
            This will prevent {user.name} from signing in and revoke their existing sessions.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form {...banForm}>
            <form className="space-y-4" onSubmit={banForm.handleSubmit(onSubmit)}>
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
                <Button onClick={onCancel} type="button" variant="outline">
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
  );
}

type ImpersonateUserDialogProps = {
  open: boolean;
  user: UserRow;
  status: UserStatus;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function ImpersonateUserDialog({
  open,
  user,
  status,
  isPending,
  onOpenChange,
  onCancel,
  onConfirm,
}: ImpersonateUserDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Impersonate user</DialogTitle>
          <DialogDescription>
            You will be signed in as {user.name}. You can stop impersonating from the account
            banner.
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
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button loading={isPending} onClick={onConfirm}>
            Impersonate user
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

type DeleteUserDialogProps = {
  open: boolean;
  user: UserRow;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function DeleteUserDialog({
  open,
  user,
  isPending,
  onOpenChange,
  onConfirm,
}: DeleteUserDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <strong>{user.name}</strong> ({user.email}) and all of their
            sessions, accounts, and profile data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <Button loading={isPending} onClick={onConfirm} variant="destructive">
            Delete user
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UserActions({ user }: { user: UserRow }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data: { user: currentUser },
  } = useUser();
  const [dialogsState, dispatchDialogs] = useReducer(userDialogsReducer, initialUserDialogsState);
  const { viewOpen, banOpen, roleOpen, impersonateOpen, deleteOpen } = dialogsState;
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

  const handleRoleOpenChange = (open: boolean) => {
    dispatchDialogs({ type: "set", dialog: "roleOpen", open });

    if (open) {
      roleForm.reset({ role: currentRole });
    }
  };

  const handleBanOpenChange = (open: boolean) => {
    dispatchDialogs({ type: "set", dialog: "banOpen", open });

    if (!open) {
      banForm.reset({ banReason: "" });
    }
  };

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
        dispatchDialogs({ type: "set", dialog: "banOpen", open: false });
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

  const unbanMutation = useMutation({
    ...trpc.admin.unbanUser.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "User unbanned",
          description: `${user.name} can sign in again.`,
          type: "success",
        });
        await invalidateUsers();
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to unban user",
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
        dispatchDialogs({ type: "set", dialog: "roleOpen", open: false });
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

  const deleteMutation = useMutation({
    ...trpc.admin.deleteUser.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "User deleted",
          description: `${user.name} has been permanently removed.`,
          type: "success",
        });
        dispatchDialogs({ type: "set", dialog: "deleteOpen", open: false });
        await invalidateUsers();
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to delete user",
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
  const canDelete = !isSelf;

  const onBanSubmit = async (data: BanUserInput) => {
    await banMutation.mutateAsync({ userId: user.id, banReason: data.banReason });
  };

  const onRoleSubmit = async (data: SetUserRoleInput) => {
    await setRoleMutation.mutateAsync({ userId: user.id, role: data.role });
  };

  const status = STATUS_CONFIG[getUserStatus(user)];
  const handleBanToggle = () => {
    if (user.banned) {
      unbanMutation.mutate({ userId: user.id });
      return;
    }

    dispatchDialogs({ type: "set", dialog: "banOpen", open: true });
  };

  return (
    <>
      <UserActionsMenu
        canBan={canBan}
        canDelete={canDelete}
        canImpersonate={canImpersonate}
        canManageRole={canManageRole}
        onBanToggle={handleBanToggle}
        onChangeRole={() => dispatchDialogs({ type: "set", dialog: "roleOpen", open: true })}
        onDelete={() => dispatchDialogs({ type: "set", dialog: "deleteOpen", open: true })}
        onImpersonate={() =>
          dispatchDialogs({ type: "set", dialog: "impersonateOpen", open: true })
        }
        onView={() => dispatchDialogs({ type: "set", dialog: "viewOpen", open: true })}
        user={user}
      />

      <Sheet
        onOpenChange={(open) => dispatchDialogs({ type: "set", dialog: "viewOpen", open })}
        open={viewOpen}
      >
        <SheetPopup variant="inset">
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

      <ChangeRoleDialog
        currentRole={currentRole}
        onCancel={() => dispatchDialogs({ type: "set", dialog: "roleOpen", open: false })}
        onOpenChange={handleRoleOpenChange}
        onSubmit={onRoleSubmit}
        open={roleOpen}
        roleForm={roleForm}
        selectedRole={selectedRole}
        user={user}
      />

      <BanUserDialog
        banForm={banForm}
        onCancel={() => dispatchDialogs({ type: "set", dialog: "banOpen", open: false })}
        onOpenChange={handleBanOpenChange}
        onSubmit={onBanSubmit}
        open={banOpen}
        user={user}
      />

      <ImpersonateUserDialog
        isPending={impersonateMutation.isPending}
        onCancel={() => dispatchDialogs({ type: "set", dialog: "impersonateOpen", open: false })}
        onConfirm={() => impersonateMutation.mutate({ userId: user.id })}
        onOpenChange={(open) => dispatchDialogs({ type: "set", dialog: "impersonateOpen", open })}
        open={impersonateOpen}
        status={status}
        user={user}
      />

      <DeleteUserDialog
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ userId: user.id })}
        onOpenChange={(open) => dispatchDialogs({ type: "set", dialog: "deleteOpen", open })}
        open={deleteOpen}
        user={user}
      />
    </>
  );
}
