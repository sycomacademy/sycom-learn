import { Link } from "@tanstack/react-router";

import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";

type LearnPlayerContext = AppRouterOutputs["learn"]["getPlayerContext"];

type AccessPanelProps = Extract<
  LearnPlayerContext,
  { status: "catalog_forbidden" | "not_enrolled" | "course_not_found" }
>;

export function LearnAccessPanel({
  courseId,
  variant,
}: {
  courseId: string;
  variant: AccessPanelProps;
}) {
  if (variant.status === "course_not_found") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Course not found</CardTitle>
            <CardDescription>
              This course is not available or may have been unpublished.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button render={<Link to="/dashboard/catalog" />} variant="default">
              Go to catalog
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const title =
    variant.status === "catalog_forbidden"
      ? "You do not have access to this course"
      : "You are not enrolled in this course";

  const contactLabel = variant.isPlatformCourse
    ? "Contact support"
    : "Contact your organization owner";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {variant.isPlatformCourse
              ? `Email ${variant.contactEmail} for help, or browse the catalog to enroll in available courses.`
              : `Email ${variant.contactEmail} to request access. You can also browse the catalog for other courses.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{contactLabel}:</span>{" "}
            <a
              className="text-primary underline underline-offset-4"
              href={`mailto:${variant.contactEmail}`}
            >
              {variant.contactEmail}
            </a>
          </p>
          <p className="mt-2 font-mono text-xs">Course ID: {courseId}</p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button render={<Link to="/dashboard/catalog" />} variant="default">
            Go to catalog
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
