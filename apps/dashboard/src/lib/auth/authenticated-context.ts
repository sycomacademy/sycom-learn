import { toastManager } from "@sycom/ui/components/toast";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { useTRPC } from "@/lib/trpc/client";

const authenticatedRouteApi = getRouteApi("/_authenticated");

export function useAuthenticatedContext() {
  return authenticatedRouteApi.useRouteContext();
}

function useProfileState() {
  const trpc = useTRPC();
  const context = useAuthenticatedContext();
  const { data } = useSuspenseQuery({
    ...trpc.profile.get.queryOptions(),
    initialData: {
      profile: context.profile,
      session: context.session,
      user: context.user,
    },
  });

  return data;
}

export function useAuthSession() {
  return useProfileState().session;
}

export function useUser() {
  return useProfileState().user;
}

export function useUserProfile() {
  return useProfileState().profile;
}

export function useUpdateUserProfileMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const profileQueryKey = trpc.profile.get.queryKey();

  return useMutation({
    ...trpc.profile.update.mutationOptions({
      onMutate: async (newData: { name?: string }) => {
        await queryClient.cancelQueries({ queryKey: profileQueryKey });
        const previousData = queryClient.getQueryData(profileQueryKey);
        queryClient.setQueryData(profileQueryKey, (old) =>
          old && newData.name !== undefined
            ? { ...old, user: { ...old.user, name: newData.name } }
            : old,
        );
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
