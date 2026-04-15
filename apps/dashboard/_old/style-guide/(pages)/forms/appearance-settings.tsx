import { CheckIcon } from "lucide-react";
import Image from "next/image";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const modes = [
  {
    name: "Light",
    value: "light",
    image: "/placeholder.svg",
  },
  {
    name: "Dark",
    value: "dark",
    image: "/placeholder.svg",
  },
  {
    name: "System",
    value: "system",
    image: "/placeholder.svg",
  },
];

const accents = [
  {
    name: "Blue",
    value: "#007AFF",
  },
  {
    name: "Purple",
    value: "#6A4695",
  },
  {
    name: "Red",
    value: "#FF3B30",
  },
  {
    name: "Orange",
    value: "#FF9500",
  },
];

export function AppearanceSettings() {
  return (
    <FieldSet>
      <FieldLegend>Appearance</FieldLegend>
      <FieldDescription>
        Configure appearance. accent, scroll bar, and more.
      </FieldDescription>
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">Mode</FieldLegend>
          <FieldDescription>
            Select the mode to use for the appearance.
          </FieldDescription>
          <RadioGroup
            className="flex @min-[28rem]/field-group:grid @min-[28rem]/field-group:grid-cols-3 flex-col gap-4"
            defaultValue="light"
          >
            {modes.map((mode) => (
              <FieldLabel
                className="gap-0 overflow-hidden"
                htmlFor={mode.value}
                key={mode.value}
              >
                <Image
                  alt={mode.name}
                  className="@min-[28rem]/field-group:block hidden aspect-video w-full object-cover dark:brightness-[0.2] dark:grayscale"
                  height={90}
                  src={mode.image}
                  width={160}
                />
                <Field
                  className="@min-[28rem]/field-group:border-t @min-[28rem]/field-group:border-t-input"
                  orientation="horizontal"
                >
                  <FieldTitle>{mode.name}</FieldTitle>
                  <RadioGroupItem id={mode.value} value={mode.value} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>
        <FieldSeparator />
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Accent</FieldTitle>
            <FieldDescription>
              Select the accent color to use for the appearance.
            </FieldDescription>
          </FieldContent>
          <FieldSet aria-label="Accent">
            <RadioGroup className="flex flex-wrap gap-2" defaultValue="#007AFF">
              {accents.map((accent) => (
                <Label
                  className="flex size-6 items-center justify-center rounded-full"
                  htmlFor={accent.value}
                  key={accent.value}
                  style={{ backgroundColor: accent.value }}
                >
                  <RadioGroupItem
                    aria-label={accent.name}
                    className="peer sr-only"
                    id={accent.value}
                    value={accent.value}
                  />
                  <CheckIcon className="hidden size-4 stroke-white peer-data-[state=checked]:block" />
                </Label>
              ))}
            </RadioGroup>
          </FieldSet>
        </Field>
        <FieldSeparator />
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="icon-size">Sidebar Icon Size</FieldLabel>
            <FieldDescription>
              Select the size of the sidebar icons.
            </FieldDescription>
          </FieldContent>
          <Select>
            <SelectTrigger className="ml-auto" id="icon-size">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <FieldSeparator />
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="tinting">Wallpaper Tinting</FieldLabel>
            <FieldDescription>
              Allow the wallpaper to be tinted with the accent color.
            </FieldDescription>
          </FieldContent>
          <Switch defaultChecked id="tinting" />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
