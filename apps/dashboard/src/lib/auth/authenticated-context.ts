import { toastManager } from "@sycom/ui/components/toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc/client";

const authenticatedRouteApi = getRouteApi("/_authenticated");

export function useAuthenticatedContext() {
  return authenticatedRouteApi.useRouteContext();
}

export function useUserProfile() {
  const { profile, session, user } = useAuthenticatedContext();
  return {
    profile,
    session,
    user,
  };
}

export function useUpdateUserProfileMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const profileQueryKey = trpc.profile.get.queryKey();

  return useMutation({
    ...trpc.user.update.mutationOptions({
      onMutate: async (newData: UpdateAccountInput) => {
        await queryClient.cancelQueries({ queryKey: profileQueryKey });
        const previousData = queryClient.getQueryData(profileQueryKey);
        type ProfileData = RouterOutputs["user"]["me"];
        queryClient.setQueryData(profileQueryKey, (old: ProfileData | undefined) => {
          if (!old || typeof old !== "object") {
            return old;
          }
          return {
            ...old,
            user:
              newData.name !== undefined || newData.email !== undefined
                ? { ...old.user, ...newData }
                : old.user,
            profile:
              newData.bio !== undefined || newData.settings !== undefined
                ? {
                    ...old.profile,
                    ...(newData.bio !== undefined && { bio: newData.bio }),
                    ...(newData.settings !== undefined && {
                      settings: {
                        ...old.profile?.settings,
                        ...newData.settings,
                      },
                    }),
                  }
                : old.profile,
          } as ProfileData;
        });
        return { previousData };
      },
      onError: (_err, _vars, context) => {
        if (context?.previousData !== undefined) {
          queryClient.setQueryData(profileQueryKey, context.previousData);
        }
        toastManager.add({
          title: "Update failed",
          description: _err.message ?? "Something went wrong. Please try again.",
          type: "error",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: profileQueryKey });
      },
    }),
  });
}
