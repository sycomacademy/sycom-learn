import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/users/")({
  component: UsersAllPage,
});

function UsersAllPage() {
  return <div className="flex flex-col gap-6 px-6 py-6">Hello</div>;
}
