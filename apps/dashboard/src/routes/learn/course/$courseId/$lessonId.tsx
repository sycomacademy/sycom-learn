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

export const Route = createFileRoute("/learn/course/$courseId/$lessonId")({
  component: LearnLessonPlaceholderPage,
});

function LearnLessonPlaceholderPage() {
  const { courseId, lessonId } = Route.useParams();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lesson</CardTitle>
          <CardDescription>Coming soon — lesson player is not wired up yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Course <span className="font-mono text-xs">{courseId}</span> · lesson{" "}
            <span className="font-mono text-xs">{lessonId}</span>
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            render={<Link params={{ courseId }} to="/learn/course/$courseId" />}
            variant="outline"
          >
            Course home
          </Button>
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
