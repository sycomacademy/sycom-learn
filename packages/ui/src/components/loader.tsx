import { Spinner } from "@sycom/ui/components/spinner";

/**
 * Centered full-size loading surface for route `pendingComponent` and similar.
 */
export function Loader() {
  return (
    <div className="flex h-full min-h-40 w-full items-center justify-center pt-8">
      <Spinner className="size-6" />
    </div>
  );
}
