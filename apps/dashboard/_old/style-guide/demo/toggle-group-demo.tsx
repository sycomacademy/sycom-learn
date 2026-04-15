import {
  BoldIcon,
  BookmarkIcon,
  HeartIcon,
  ItalicIcon,
  StarIcon,
  UnderlineIcon,
} from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ToggleGroupDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ToggleGroup multiple spacing={2}>
        <ToggleGroupItem aria-label="Toggle bold" value="bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle italic" value="italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label="Toggle strikethrough"
          value="strikethrough"
        >
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        className="*:data-[slot=toggle-group-item]:w-20"
        defaultValue={["all"]}
        multiple={false}
        variant="outline"
      >
        <ToggleGroupItem aria-label="Toggle all" value="all">
          All
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle missed" value="missed">
          Missed
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        className="*:data-[slot=toggle-group-item]:px-3"
        defaultValue={["last-24-hours"]}
        multiple={false}
        size="sm"
        variant="outline"
      >
        <ToggleGroupItem
          aria-label="Toggle last 24 hours"
          value="last-24-hours"
        >
          Last 24 hours
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle last 7 days" value="last-7-days">
          Last 7 days
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup defaultValue={["last-24-hours"]} multiple={false} size="sm">
        <ToggleGroupItem
          aria-label="Toggle last 24 hours"
          value="last-24-hours"
        >
          Last 24 hours
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle last 7 days" value="last-7-days">
          Last 7 days
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        defaultValue={["top"]}
        multiple={false}
        size="sm"
        variant="outline"
      >
        <ToggleGroupItem aria-label="Toggle top" value="top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle bottom" value="bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle left" value="left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle right" value="right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        defaultValue={["top"]}
        multiple={false}
        size="sm"
        spacing={2}
        variant="outline"
      >
        <ToggleGroupItem aria-label="Toggle top" value="top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle bottom" value="bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle left" value="left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle right" value="right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup multiple size="sm" spacing={2} variant="outline">
        <ToggleGroupItem
          aria-label="Toggle star"
          className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-yellow-500 data-[state=on]:*:[svg]:stroke-yellow-500"
          value="star"
        >
          <StarIcon />
          Star
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label="Toggle heart"
          className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500"
          value="heart"
        >
          <HeartIcon />
          Heart
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label="Toggle bookmark"
          className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-blue-500 data-[state=on]:*:[svg]:stroke-blue-500"
          value="bookmark"
        >
          <BookmarkIcon />
          Bookmark
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
