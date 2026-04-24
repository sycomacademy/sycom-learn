import { getRouteApi } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { useTRPC } from "@/lib/trpc/client";

const dashboardRouteApi = getRouteApi("/dashboard");

export function useDashboardContext() {
  return dashboardRouteApi.useRouteContext();
}

export function useUser() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.profile.get.queryOptions());
  return data as AppRouterOutputs["profile"]["get"];
}

// export function useUpdateUserProfileMutatioan() {
//   const trpc = useTRPC();
//   const queryClient = useQueryClient();
//   const profileQueryKey = trpc.profile.get.queryKey();

//   return useMutation({
//     ...trpc.profile.update.mutationOptions({
//       onMutate: async (newData: { name?: string }) => {
//         await queryClient.cancelQueries({ queryKey: profileQueryKey });
//         const previousData = queryClient.getQueryData(profileQueryKey);
//         queryClient.setQueryData(profileQueryKey, (old) =>
//           old && newData.name !== undefined
//             ? { ...old, user: { ...old.user, name: newData.name } }
//             : old,
//         );
//         return { previousData };
//       },
//       onError: (_err, _vars, context) => {
//         if (context?.previousData !== undefined) {
//           queryClient.setQueryData(profileQueryKey, context.previousData);
//         }
//         toastManager.add({
//           title: "Update failed",
//           description: _err.message ?? "Something went wrong. Please try again.",
//           type: "error",
//         });
//       },
//       onSettled: () => {
//         queryClient.invalidateQueries({ queryKey: profileQueryKey });
//       },
//     }),
//   });
// }
