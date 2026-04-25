import { getRouteApi } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

const dashboardRouteApi = getRouteApi("/dashboard");

export function useDashboardContext() {
  return dashboardRouteApi.useRouteContext();
}

export function useUser() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.profile.get.queryOptions());
  return data;
}

export function useUserMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const profileQueryKey = trpc.profile.get.queryKey();

  const updateName = useMutation({
    ...trpc.profile.updateName.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: profileQueryKey });

        const previousData = queryClient.getQueryData(profileQueryKey);

        queryClient.setQueryData(profileQueryKey, (current) => {
          if (!current?.user) {
            return current;
          }

          return {
            ...current,
            user: {
              ...current.user,
              name: input.name,
            },
          };
        });

        return { previousData };
      },
      onError: (_error, _input, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(profileQueryKey, context.previousData);
        }
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      },
    }),
  });

  const updateProfile = useMutation({
    ...trpc.profile.updateProfile.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: profileQueryKey });

        const previousData = queryClient.getQueryData(profileQueryKey);

        queryClient.setQueryData(profileQueryKey, (current) => {
          if (!current?.profile) {
            return current;
          }

          return {
            ...current,
            profile: {
              ...current.profile,
              ...input,
            },
          };
        });

        return { previousData };
      },
      onError: (_error, _input, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(profileQueryKey, context.previousData);
        }
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      },
    }),
  });

  const updateAvatar = useMutation({
    ...trpc.profile.updateAvatar.mutationOptions({
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      },
    }),
  });

  return {
    updateName,
    updateProfile,
    updateAvatar,
  };
}
