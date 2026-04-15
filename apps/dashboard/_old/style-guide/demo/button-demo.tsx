import { ArrowRightIcon, Loader2Icon, PlusIcon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ButtonDemo() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button size="xs">Extra Small</Button>
        <Button size="xs" variant="outline">
          Outline
        </Button>
        <Button size="xs" variant="ghost">
          Ghost
        </Button>
        <Button size="xs" variant="destructive">
          Destructive
        </Button>
        <Button size="xs" variant="secondary">
          Secondary
        </Button>
        <Button size="xs" variant="link">
          Link
        </Button>
        <Button size="xs" variant="outline">
          <SendIcon /> Send
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button size="sm">Small</Button>
        <Button size="sm" variant="outline">
          Outline
        </Button>
        <Button size="sm" variant="ghost">
          Ghost
        </Button>
        <Button size="sm" variant="destructive">
          Destructive
        </Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
        <Button size="sm" variant="link">
          Link
        </Button>
        <Button size="sm" variant="outline">
          <SendIcon /> Send
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button>Button</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="link">Link</Button>
        <Button variant="outline">
          <SendIcon /> Send
        </Button>
        <Button variant="outline">
          Learn More <ArrowRightIcon />
        </Button>
        <Button disabled variant="outline">
          <Loader2Icon className="animate-spin" />
          Please wait
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button size="lg">Large</Button>
        <Button size="lg" variant="outline">
          Outline
        </Button>
        <Button size="lg" variant="ghost">
          Ghost
        </Button>
        <Button size="lg" variant="destructive">
          Destructive
        </Button>
        <Button size="lg" variant="secondary">
          Secondary
        </Button>
        <Button size="lg" variant="link">
          Link
        </Button>
        <Button size="lg" variant="outline">
          <SendIcon /> Send
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button size="icon-xs" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon-sm" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon-lg" variant="outline">
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
}
