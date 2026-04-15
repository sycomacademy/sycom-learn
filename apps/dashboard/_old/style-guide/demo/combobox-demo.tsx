"use client";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

const frameworks = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro",
] as const;

const timezones = [
  {
    value: "Americas",
    items: ["(GMT-5) New York", "(GMT-8) Los Angeles", "(GMT-6) Chicago"],
  },
  {
    value: "Europe",
    items: ["(GMT+0) London", "(GMT+1) Paris", "(GMT+1) Berlin"],
  },
  {
    value: "Asia/Pacific",
    items: ["(GMT+9) Tokyo", "(GMT+8) Shanghai", "(GMT+8) Singapore"],
  },
] as const;

const countries = [
  { code: "", value: "", label: "Select country" },
  { code: "us", value: "united-states", label: "United States" },
  { code: "ca", value: "canada", label: "Canada" },
  { code: "gb", value: "united-kingdom", label: "United Kingdom" },
  { code: "de", value: "germany", label: "Germany" },
  { code: "fr", value: "france", label: "France" },
  { code: "jp", value: "japan", label: "Japan" },
];

export function ComboboxDemo() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* Basic combobox. */}
      <div className="flex flex-wrap items-start gap-4">
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="Select a framework" />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {/* With clear button. */}
      <div className="flex flex-wrap items-start gap-4">
        <Combobox defaultValue={frameworks[0]} items={frameworks}>
          <ComboboxInput placeholder="Select a framework" showClear />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {/* With groups. */}
      <div className="flex flex-wrap items-start gap-4">
        <Combobox items={timezones}>
          <ComboboxInput placeholder="Select a timezone" />
          <ComboboxContent>
            <ComboboxEmpty>No timezones found.</ComboboxEmpty>
            <ComboboxList>
              {(group) => (
                <ComboboxGroup items={group.items} key={group.value}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {/* With trigger button. */}
      <div className="flex flex-wrap items-start gap-4">
        <Combobox defaultValue={countries[0]} items={countries}>
          <ComboboxTrigger
            render={
              <Button
                className="w-64 justify-between font-normal"
                variant="outline"
              />
            }
          >
            <ComboboxValue />
          </ComboboxTrigger>
          <ComboboxContent>
            <ComboboxInput placeholder="Search" showTrigger={false} />
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.code} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {/* Multiple selection with chips. */}
      <ComboboxMultiple />
    </div>
  );
}

function ComboboxMultiple() {
  const anchor = useComboboxAnchor();

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Combobox
        autoHighlight
        defaultValue={[frameworks[0]]}
        items={frameworks}
        multiple
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(values) => (
              <>
                {values.map((value: string) => (
                  <ComboboxChip key={value}>{value}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder="Add framework..." />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
