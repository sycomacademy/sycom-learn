"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/packages/utils/cn";

const THEMES = {
  sizes: [
    {
      name: "Default",
      value: "default",
    },
    {
      name: "Scaled",
      value: "scaled",
    },
    {
      name: "Mono",
      value: "mono",
    },
  ],
  colors: [
    {
      name: "Blue",
      value: "blue",
    },
    {
      name: "Green",
      value: "green",
    },
    {
      name: "Amber",
      value: "amber",
    },
    {
      name: "Rose",
      value: "rose",
    },
    {
      name: "Purple",
      value: "purple",
    },
    {
      name: "Orange",
      value: "orange",
    },
    {
      name: "Teal",
      value: "teal",
    },
  ],
  fonts: [
    {
      name: "Inter",
      value: "inter",
    },
    {
      name: "Noto Sans",
      value: "noto-sans",
    },
    {
      name: "Nunito Sans",
      value: "nunito-sans",
    },
    {
      name: "Figtree",
      value: "figtree",
    },
  ],
  radius: [
    {
      name: "None",
      value: "rounded-none",
    },
    {
      name: "Small",
      value: "rounded-small",
    },
    {
      name: "Medium",
      value: "rounded-medium",
    },
    {
      name: "Large",
      value: "rounded-large",
    },
    {
      name: "Full",
      value: "rounded-full",
    },
  ],
};

export function ThemeSelector({ className }: React.ComponentProps<"div">) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Label className="sr-only" htmlFor="theme-selector">
        Theme
      </Label>
      <Select
        onValueChange={(value) => setTheme(value as string)}
        value={theme}
      >
        <SelectTrigger
          className="justify-start border-secondary bg-secondary text-secondary-foreground shadow-none *:data-[slot=select-value]:w-16"
          id="theme-selector"
          size="sm"
        >
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(THEMES).map(
            ([key, themes], index) =>
              themes.length > 0 && (
                <div key={key}>
                  {index > 0 && <SelectSeparator />}
                  <SelectGroup>
                    <SelectLabel>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </SelectLabel>
                    {themes.map((theme) => (
                      <SelectItem
                        className="data-[state=checked]:opacity-50"
                        key={theme.name}
                        value={theme.value}
                      >
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </div>
              )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
