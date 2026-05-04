import type { JSONContent } from "@tiptap/core";
import { UserIcon } from "lucide-react";

import { RichTextEditor } from "@sycom/ui/components/tiptap/rich-text-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Card, CardHeader, CardTitle } from "@sycom/ui/components/card";

import type { AppRouterOutputs } from "server/trpc/routers/_app";

type CatalogCourseDetail = AppRouterOutputs["catalog"]["get"];

export type CatalogCourseSummaryProps = {
  summary: CatalogCourseDetail["summary"];
};

export function CatalogCourseSummary({ summary }: CatalogCourseSummaryProps) {
  if (!summary) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Summary</h2>
      <div className="rounded-lg border bg-card p-4">
        <RichTextEditor
          content={summary as JSONContent | null}
          editable={false}
          mode="lightweight"
          showAdvancedChrome={false}
        />
      </div>
    </section>
  );
}

export type CatalogCourseInstructorsProps = {
  instructors: CatalogCourseDetail["instructors"];
};

export function CatalogCourseInstructors({ instructors }: CatalogCourseInstructorsProps) {
  if (!instructors || instructors.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Instructors</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {instructors.map((instructor) => (
          <Card key={instructor.userId}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <Avatar className="size-10">
                <AvatarImage alt={instructor.name} src={instructor.image ?? undefined} />
                <AvatarFallback>
                  <UserIcon className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{instructor.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{instructor.role}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
