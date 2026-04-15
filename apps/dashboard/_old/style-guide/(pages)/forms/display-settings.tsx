import { SunDimIcon, SunIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export function DisplaySettings() {
  return (
    <FieldSet>
      <FieldLegend>Display</FieldLegend>
      <FieldDescription>
        Configure display settings, brightness, refresh rate, and more.
      </FieldDescription>
      <FieldGroup>
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="resolution">Resolution</FieldLabel>
            <FieldDescription>Select the display resolution.</FieldDescription>
          </FieldContent>
          <Select>
            <SelectTrigger className="ml-auto" id="resolution">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="1920x1080">1920 x 1080</SelectItem>
              <SelectItem value="2560x1440">2560 x 1440</SelectItem>
              <SelectItem value="3840x2160">3840 x 2160</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <FieldSeparator />
        <Field orientation="responsive">
          <FieldContent>
            <FieldTitle>Brightness</FieldTitle>
            <FieldDescription>
              Adjust the display brightness level.
            </FieldDescription>
          </FieldContent>
          <div className="flex min-w-[150px] items-center gap-2">
            <SunDimIcon className="size-4 shrink-0" />
            <Slider
              aria-label="Brightness"
              defaultValue={[75]}
              id="brightness"
              max={100}
              step={1}
            />
            <SunIcon className="size-4 shrink-0" />
          </div>
        </Field>
        <FieldSeparator />
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="auto-brightness">
              Automatically Adjust Brightness
            </FieldLabel>
            <FieldDescription>
              Automatically adjust brightness based on ambient light.
            </FieldDescription>
          </FieldContent>
          <Checkbox defaultChecked id="auto-brightness" />
        </Field>
        <FieldSeparator />
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="true-tone">True Tone</FieldLabel>
            <FieldDescription>
              Automatically adjust colors to match ambient lighting.
            </FieldDescription>
          </FieldContent>
          <Switch id="true-tone" />
        </Field>
        <FieldSeparator />
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="refresh-rate">Refresh Rate</FieldLabel>
            <FieldDescription>
              Select the display refresh rate.
            </FieldDescription>
          </FieldContent>
          <Select>
            <SelectTrigger className="ml-auto min-w-[200px]" id="refresh-rate">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="60hz">60 Hz</SelectItem>
              <SelectItem value="120hz">120 Hz</SelectItem>
              <SelectItem value="144hz">144 Hz</SelectItem>
              <SelectItem value="240hz">240 Hz</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <FieldSeparator />
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="tv-connection">
              When connected to TV
            </FieldLabel>
            <FieldDescription>
              Choose display behavior when connected to a TV.
            </FieldDescription>
          </FieldContent>
          <Select>
            <SelectTrigger className="ml-auto" id="tv-connection">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="mirror">Mirror Display</SelectItem>
              <SelectItem value="extend">Extend Display</SelectItem>
              <SelectItem value="tv-only">TV Only</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
