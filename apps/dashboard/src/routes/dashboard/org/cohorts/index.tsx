import { useIsFetching, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef } from "react";

import { OrgCohortListItem } from "@/components/dashboard/org/cohorts/org-cohort-list-item";
import { OrgCohortsToolbar } from "@/components/dashboard/org/cohorts/org-cohorts-toolbar";
import {
  getOrgCohortsListInput,
  orgCohortListPageSize,
  orgCohortsSearchSchema,
  type OrgCohortRow,
  type OrgCohortsSearchInput,
} from "@/components/dashboard/org/cohorts/org-cohorts-schema";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";
import { Spinner } from "@sycom/ui/components/spinner";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

type CohortListResult = AppRouterOutputs["organization"]["listCohorts"];

function getCohortsInfiniteQueryOptions(
  trpc: Pick<ReturnType<typeof useTRPC>, "organization">,
  search: OrgCohortsSearchInput,
) {
  return {
    initialPageParam: 0,
    queryKey: [...trpc.organization.listCohorts.queryKey(), search.search ?? ""],
    queryFn: async (context: unknown): Promise<CohortListResult> => {
      const pageParam = (context as { pageParam: number }).pageParam;
      const queryOptions = trpc.organization.listCohorts.queryOptions(
        getOrgCohortsListInput(search, pageParam),
      );
      const queryFn = queryOptions.queryFn;
      if (!queryFn) {
        throw new Error("Missing query function for organization.listCohorts.");
      }

      type QueryContext = Parameters<NonNullable<typeof queryFn>>[0];
      return await queryFn({
        ...(context as Omit<QueryContext, "queryKey">),
        queryKey: queryOptions.queryKey,
      } as QueryContext);
    },
    getNextPageParam: (lastPage: CohortListResult, allPages: CohortListResult[]) => {
      const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
      if (loaded >= lastPage.totalCount || lastPage.rows.length < orgCohortListPageSize) {
        return undefined;
      }
      return loaded;
    },
  };
}

export const Route = createFileRoute("/dashboard/org/cohorts/")({
  head: () => ({
    meta: [{ title: "Cohorts | Organization | Sycom LMS" }],
  }),
  validateSearch: orgCohortsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const trpc = context.trpc;
    await context.queryClient.ensureInfiniteQueryData({
      initialPageParam: 0,
      queryKey: [...trpc.organization.listCohorts.queryKey(), deps.search ?? ""],
      queryFn: async (context): Promise<CohortListResult> => {
        const pageParam = context.pageParam as number;
        const queryOptions = trpc.organization.listCohorts.queryOptions(
          getOrgCohortsListInput(deps, pageParam),
        );
        const queryFn = queryOptions.queryFn;
        if (!queryFn) {
          throw new Error("Missing query function for organization.listCohorts.");
        }

        return await queryFn({
          ...context,
          queryKey: queryOptions.queryKey,
        });
      },
      getNextPageParam: (lastPage: CohortListResult, allPages: CohortListResult[]) => {
        const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
        if (loaded >= lastPage.totalCount || lastPage.rows.length < orgCohortListPageSize) {
          return undefined;
        }
        return loaded;
      },
    });
  },
  component: OrgCohortsPage,
});

function OrgCohortsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const scrollHostRef = useRef<HTMLElement | null>(null);
  const detachScrollRef = useRef<(() => void) | null>(null);

  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 300,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (_prev: OrgCohortsSearchInput) => ({ search: next }),
      }),
  });

  const infiniteQuery = useSuspenseInfiniteQuery(getCohortsInfiniteQueryOptions(trpc, search));
  const isFetching = useIsFetching({ queryKey: trpc.organization.listCohorts.queryKey() }) > 0;

  const cohorts = useMemo(
    () => infiniteQuery.data.pages.flatMap((page) => page.rows) as OrgCohortRow[],
    [infiniteQuery.data],
  );

  const handleScrollLoadMore = useCallback(() => {
    const scrollHost = scrollHostRef.current;
    if (!scrollHost) {
      return;
    }

    const remaining = scrollHost.scrollHeight - scrollHost.scrollTop - scrollHost.clientHeight;
    if (
      remaining < 240 &&
      infiniteQuery.hasNextPage &&
      !infiniteQuery.isFetchingNextPage &&
      infiniteQuery.status === "success"
    ) {
      void infiniteQuery.fetchNextPage();
    }
  }, [infiniteQuery]);

  const attachScrollHost = useCallback(
    (node: HTMLDivElement | null) => {
      detachScrollRef.current?.();
      detachScrollRef.current = null;
      scrollHostRef.current = null;

      if (!node) {
        return;
      }

      const scrollHost = node.closest<HTMLElement>("[role='main']");
      if (!scrollHost) {
        return;
      }

      scrollHostRef.current = scrollHost;
      const onScroll = () => handleScrollLoadMore();
      scrollHost.addEventListener("scroll", onScroll, { passive: true });
      detachScrollRef.current = () => scrollHost.removeEventListener("scroll", onScroll);
    },
    [handleScrollLoadMore],
  );

  return (
    <div className="flex flex-col gap-4 px-6 py-6" ref={attachScrollHost}>
      <OrgCohortsToolbar
        isFetching={isFetching}
        onRefresh={infiniteQuery.refetch}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <div className="space-y-3">
        {cohorts.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No cohorts found.
          </div>
        ) : (
          cohorts.map((cohort) => <OrgCohortListItem cohort={cohort} key={cohort.id} />)
        )}

        <div className="flex h-12 items-center justify-center">
          {infiniteQuery.isFetchingNextPage ? <Spinner className="size-4" /> : null}
        </div>
      </div>
    </div>
  );
}
