import { AlertCircleIcon, ArrowRightIcon, CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function BadgeDemo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex w-full flex-wrap gap-2">
        <Badge>Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="link">Link</Badge>
      </div>
      <div className="flex w-full flex-wrap gap-2">
        <Badge variant="outline">
          <CheckIcon />
          Badge
        </Badge>
        <Badge variant="destructive">
          <AlertCircleIcon />
          Alert
        </Badge>
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
          8
        </Badge>
        <Badge
          className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
          variant="destructive"
        >
          99
        </Badge>
        <Badge
          className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
          variant="outline"
        >
          20+
        </Badge>
      </div>
      <div className="flex w-full flex-wrap gap-2">
        <Badge>
          Link <ArrowRightIcon />
        </Badge>
        <Badge variant="secondary">
          Link <ArrowRightIcon />
        </Badge>
        <Badge variant="destructive">
          Link <ArrowRightIcon />
        </Badge>
        <Badge variant="outline">
          Link <ArrowRightIcon />
        </Badge>
        <Badge variant="ghost">
          Link <ArrowRightIcon />
        </Badge>
        <Badge variant="link">
          Link <ArrowRightIcon />
        </Badge>
      </div>
    </div>
  );
}
