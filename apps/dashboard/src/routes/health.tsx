import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/health")({
  component: HealthRoute,
});

function HealthRoute() {
  return <pre>ok</pre>;
}
