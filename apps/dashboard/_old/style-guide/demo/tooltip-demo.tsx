import { InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TooltipDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover</Button>} />
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
      <div className="flex gap-2">
        {["top", "right", "bottom", "left"].map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger
              render={
                <Button className="capitalize" variant="outline">
                  {side}
                </Button>
              }
            />
            <TooltipContent side={side as "top" | "right" | "bottom" | "left"}>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button size="icon" variant="ghost">
              <InfoIcon />
              <span className="sr-only">Info</span>
            </Button>
          }
        />
        <TooltipContent>
          To learn more about how this works, check out the docs. If you have
          any questions, please reach out to us.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
