import { useIsFetching, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CERTIFICATE_TEMPLATE_IDS,
  certificateTemplateDescriptions,
  certificateTemplateLabels,
  type CertificateTemplateId,
} from "@sycom/certificates/meta";
import { CheckCircle2Icon, Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  courseCertificatesSearchSchema,
  type CourseCertificatesSearchInput,
} from "@/components/dashboard/course/course-certificates-schema";
import {
  courseMembersPageSize,
  getCourseMembersListInput,
  type CourseEnrollmentRow,
} from "@/components/dashboard/course/course-members-schema";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";
import { Field, FieldLabel } from "@sycom/ui/components/field";
import { Input } from "@sycom/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Radio, RadioGroup } from "@sycom/ui/components/radio-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@sycom/ui/components/tabs";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

type EnrollmentListResult = AppRouterOutputs["enrollment"]["listByCourse"];

function getEnrollmentInfiniteQueryOptions(
  trpc: Pick<ReturnType<typeof useTRPC>, "enrollment">,
  courseId: string,
  search: Pick<CourseCertificatesSearchInput, "search">,
) {
  return {
    initialPageParam: 0,
    queryKey: [...trpc.enrollment.listByCourse.queryKey({ courseId }), search.search ?? ""],
    queryFn: async (context: unknown): Promise<EnrollmentListResult> => {
      const pageParam = (context as { pageParam: number }).pageParam;
      const queryOptions = trpc.enrollment.listByCourse.queryOptions(
        getCourseMembersListInput({ search: search.search }, pageParam, courseId),
      );
      const queryFn = queryOptions.queryFn;
      if (!queryFn) {
        throw new Error("Missing query function for enrollment.listByCourse.");
      }

      type QueryContext = Parameters<NonNullable<typeof queryFn>>[0];
      return await queryFn({
        ...(context as Omit<QueryContext, "queryKey">),
        queryKey: queryOptions.queryKey,
      } as QueryContext);
    },
    getNextPageParam: (lastPage: EnrollmentListResult, allPages: EnrollmentListResult[]) => {
      const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
      if (loaded >= lastPage.totalCount || lastPage.rows.length < courseMembersPageSize) {
        return undefined;
      }
      return loaded;
    },
  };
}

export const Route = createFileRoute("/dashboard/course/$courseId/certificates")({
  validateSearch: courseCertificatesSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }) => {
    await context.queryClient.ensureInfiniteQueryData({
      initialPageParam: 0,
      queryKey: [
        ...context.trpc.enrollment.listByCourse.queryKey({ courseId: params.courseId }),
        deps.search ?? "",
      ],
      queryFn: async (contextArg): Promise<EnrollmentListResult> => {
        const pageParam = contextArg.pageParam as number;
        const queryOptions = context.trpc.enrollment.listByCourse.queryOptions(
          getCourseMembersListInput({ search: deps.search }, pageParam, params.courseId),
        );
        const queryFn = queryOptions.queryFn;
        if (!queryFn) {
          throw new Error("Missing query function for enrollment.listByCourse.");
        }

        return await queryFn({ ...contextArg, queryKey: queryOptions.queryKey });
      },
      getNextPageParam: (lastPage: EnrollmentListResult, allPages: EnrollmentListResult[]) => {
        const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
        if (loaded >= lastPage.totalCount || lastPage.rows.length < courseMembersPageSize) {
          return undefined;
        }
        return loaded;
      },
    });
  },
  component: CourseCertificatesPage,
});

function CertificateMemberRow({ enrollment }: { enrollment: CourseEnrollmentRow }) {
  const completionLabel = `${enrollment.completedLessonCount}/${enrollment.totalLessonCount} complete`;

  return (
    <div className="flex items-center justify-between gap-3 border px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 rounded-md">
          {enrollment.image ? (
            <AvatarImage alt={enrollment.name} src={buildImageUrl(enrollment.image)} />
          ) : null}
          <AvatarFallback className="rounded-md text-xs text-muted-foreground">
            {getInitials(enrollment.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{enrollment.name}</p>
          <p className="truncate text-xs text-muted-foreground">{enrollment.email}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="outline">{enrollment.status}</Badge>
            <Badge variant="secondary">{completionLabel}</Badge>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {enrollment.certificateIssued ? (
          <CheckCircle2Icon
            aria-label="Certificate issued"
            className="size-9 text-green-600 dark:text-green-500"
          />
        ) : (
          <Button onClick={() => undefined} size="sm" type="button" variant="outline">
            Send certificate
          </Button>
        )}
      </div>
    </div>
  );
}

function CourseCertificatesPage() {
  const { courseId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();

  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplateId>(
    CERTIFICATE_TEMPLATE_IDS[0],
  );
  const [awardHeadline, setAwardHeadline] = useState("Certificate of completion");
  const [certifyPhrase, setCertifyPhrase] = useState("This is to certify that");
  const [issuerLine, setIssuerLine] = useState("");
  const [footnoteLine, setFootnoteLine] = useState("");

  const scrollHostRef = useRef<HTMLElement | null>(null);
  const detachScrollRef = useRef<(() => void) | null>(null);

  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 300,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: CourseCertificatesSearchInput) => ({
          ...prev,
          search: next,
        }),
      }),
  });

  const enrollmentsQuery = useSuspenseInfiniteQuery(
    getEnrollmentInfiniteQueryOptions(trpc, courseId, search),
  );

  const isFetchingEnrollments =
    useIsFetching({ queryKey: trpc.enrollment.listByCourse.queryKey({ courseId }) }) > 0;

  const enrollments = useMemo(
    () => enrollmentsQuery.data.pages.flatMap((page) => page.rows),
    [enrollmentsQuery.data],
  );

  const handleScrollLoadMore = useCallback(() => {
    const scrollHost = scrollHostRef.current;
    if (!scrollHost) return;

    const remaining = scrollHost.scrollHeight - scrollHost.scrollTop - scrollHost.clientHeight;
    if (
      remaining < 240 &&
      enrollmentsQuery.hasNextPage &&
      !enrollmentsQuery.isFetchingNextPage &&
      enrollmentsQuery.status === "success"
    ) {
      void enrollmentsQuery.fetchNextPage();
    }
  }, [enrollmentsQuery]);

  const attachScrollHost = useCallback(
    (node: HTMLDivElement | null) => {
      detachScrollRef.current?.();
      detachScrollRef.current = null;
      scrollHostRef.current = null;

      if (!node) return;

      const scrollHost = node.closest<HTMLElement>("[role='main']");
      if (!scrollHost) return;

      scrollHostRef.current = scrollHost;
      const onScroll = () => handleScrollLoadMore();
      scrollHost.addEventListener("scroll", onScroll, { passive: true });
      detachScrollRef.current = () => scrollHost.removeEventListener("scroll", onScroll);
    },
    [handleScrollLoadMore],
  );

  const setPanel = (panel: CourseCertificatesSearchInput["panel"]) => {
    void navigate({
      replace: true,
      search: (prev: CourseCertificatesSearchInput) => ({ ...prev, panel }),
    });
  };

  return (
    <div ref={attachScrollHost}>
      <Tabs
        className="max-h-20 gap-8 sm:flex-row"
        orientation="vertical"
        value={search.panel}
        onValueChange={(value) =>
          value === "design" || value === "members" ? setPanel(value) : undefined
        }
      >
        <TabsList className="w-full shrink-0 sm:w-44">
          <TabsTab value="design">Design</TabsTab>
          <TabsTab value="members">Members</TabsTab>
        </TabsList>

        <TabsPanel value="design" className="min-h-80 min-w-0 flex-1 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Certificate design</CardTitle>
              <CardDescription>
                Pick a PDF template and adjust wording shown on certificates.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-medium">Templates</h3>
                <RadioGroup
                  name="certificate-template"
                  onValueChange={(v) => void setSelectedTemplate(v as CertificateTemplateId)}
                  value={selectedTemplate}
                >
                  <div className="flex flex-col gap-3">
                    {CERTIFICATE_TEMPLATE_IDS.map((id) => (
                      <div
                        key={id}
                        className="flex gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-accent/40"
                      >
                        <Radio
                          className="mt-0.5 shrink-0"
                          id={`certificate-template-${courseId}-${id}`}
                          value={id}
                        />
                        <label
                          className="min-w-0 flex-1 cursor-pointer"
                          htmlFor={`certificate-template-${courseId}-${id}`}
                        >
                          <span className="font-medium">{certificateTemplateLabels[id]}</span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {certificateTemplateDescriptions[id]}
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-medium">Keywords</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field className="gap-2">
                    <FieldLabel className="text-xs" htmlFor={`cert-headline-${courseId}`}>
                      Award headline
                    </FieldLabel>
                    <Input
                      id={`cert-headline-${courseId}`}
                      autoComplete="off"
                      onChange={(e) => setAwardHeadline(e.target.value)}
                      placeholder="Certificate of completion"
                      value={awardHeadline}
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel className="text-xs" htmlFor={`cert-intro-${courseId}`}>
                      Certification line
                    </FieldLabel>
                    <Input
                      id={`cert-intro-${courseId}`}
                      autoComplete="off"
                      onChange={(e) => setCertifyPhrase(e.target.value)}
                      placeholder="This is to certify that"
                      value={certifyPhrase}
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel className="text-xs" htmlFor={`cert-issuer-${courseId}`}>
                      Issuer line{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      id={`cert-issuer-${courseId}`}
                      autoComplete="organization"
                      onChange={(e) => setIssuerLine(e.target.value)}
                      placeholder="Shown below the course title"
                      value={issuerLine}
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel className="text-xs" htmlFor={`cert-foot-${courseId}`}>
                      Footer note{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      id={`cert-foot-${courseId}`}
                      autoComplete="off"
                      onChange={(e) => setFootnoteLine(e.target.value)}
                      placeholder="Additional text on the certificate"
                      value={footnoteLine}
                    />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">
                  Learner name, course title, certificate number and date are filled automatically
                  when issued.
                </p>
              </section>

              <section
                aria-labelledby="preview-heading"
                className="rounded-lg border bg-muted/20 p-4"
              >
                <h3
                  className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  id="preview-heading"
                >
                  Preview
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Template</dt>
                    <dd className="font-medium">{certificateTemplateLabels[selectedTemplate]}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Headline</dt>
                    <dd className="font-medium">{awardHeadline || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Certification</dt>
                    <dd className="font-medium">{certifyPhrase || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Issuer</dt>
                    <dd className="font-medium">{issuerLine || "(none)"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Footer</dt>
                    <dd className="font-medium">{footnoteLine || "(none)"}</dd>
                  </div>
                </dl>
              </section>
            </CardPanel>
          </Card>
        </TabsPanel>

        <TabsPanel value="members" className="min-h-80 min-w-0 flex-1 outline-none">
          <div className="flex flex-col gap-4">
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-semibold">Members</h2>
              <p className="text-sm text-muted-foreground">
                Learners enrolled in this course—send certificates when ready.
              </p>
            </div>

            <label className="sr-only" htmlFor="certificates-members-search">
              Search enrolled learners
            </label>
            <InputGroup className="w-full max-w-md">
              <InputGroupAddon align="inline-start">
                {isFetchingEnrollments ? (
                  <Spinner className="size-4" />
                ) : (
                  <Search className="size-4 opacity-60" />
                )}
              </InputGroupAddon>
              <InputGroupInput
                id="certificates-members-search"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search enrolled learners..."
                type="search"
                value={searchInput}
              />
            </InputGroup>

            <div className="space-y-3">
              {enrollments.length === 0 ? (
                <div className="rounded-lg border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
                  No enrolled learners match your search.
                </div>
              ) : (
                enrollments.map((row) => (
                  <CertificateMemberRow enrollment={row} key={row.enrollmentId} />
                ))
              )}

              <div className="flex h-12 items-center justify-center">
                {enrollmentsQuery.isFetchingNextPage ? <Spinner className="size-4" /> : null}
              </div>
            </div>
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  );
}
