import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";

export const Route = createFileRoute("/learn/course/$courseId")({
  component: LearnCoursePlaceholderPage,
});

function LearnCoursePlaceholderPage() {
  const { courseId } = Route.useParams();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Learning experience</CardTitle>
          <CardDescription>Coming soon — course player is not wired up yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You opened the learner route for course{" "}
            <span className="font-mono text-xs">{courseId}</span>. We&apos;ll replace this screen
            with lessons, progress, and assessments.
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            render={<Link params={{ courseId }} to="/dashboard/catalog/$courseId" />}
            variant="outline"
          >
            Back to catalog
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
