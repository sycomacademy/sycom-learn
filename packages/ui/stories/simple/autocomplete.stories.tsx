import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";

import {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@sycom/ui/components/autocomplete";

const flatItems = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
] as const;

type Fruit = (typeof flatItems)[number];

const groupedItems = [
  {
    items: [
      { value: "nyc", label: "New York" },
      { value: "sf", label: "San Francisco" },
    ],
  },
  {
    items: [
      { value: "ldn", label: "London" },
      { value: "ber", label: "Berlin" },
    ],
  },
] as const;

const meta = {
  title: "Simple/Autocomplete",
  component: Autocomplete,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Autocomplete>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="w-72">
      <Autocomplete defaultOpen items={flatItems}>
        <AutocompleteInput
          aria-label="Search fruit"
          placeholder="Type to filter…"
          showClear
          showTrigger
        />
        <AutocompletePopup>
          <AutocompleteEmpty>No items found.</AutocompleteEmpty>
          <AutocompleteList>
            {(item: Fruit) => (
              <AutocompleteItem key={item.value} value={item}>
                {item.label}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      </Autocomplete>
    </div>
  ),
};

export const WithSearchAddon: Story = {
  render: () => (
    <div className="w-72">
      <Autocomplete defaultOpen items={flatItems}>
        <AutocompleteInput
          aria-label="Search fruit"
          placeholder="Search…"
          showClear
          startAddon={<SearchIcon aria-hidden className="text-muted-foreground" />}
        />
        <AutocompletePopup>
          <AutocompleteEmpty>No items found.</AutocompleteEmpty>
          <AutocompleteList>
            {(item: Fruit) => (
              <AutocompleteItem key={item.value} value={item}>
                {item.label}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      </Autocomplete>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => (
    <div className="w-72">
      <Autocomplete defaultOpen items={groupedItems}>
        <AutocompleteInput aria-label="Search city" placeholder="City…" />
        <AutocompletePopup>
          <AutocompleteEmpty>No cities found.</AutocompleteEmpty>
          <AutocompleteList>
            <AutocompleteGroup>
              <AutocompleteGroupLabel>United States</AutocompleteGroupLabel>
              <AutocompleteCollection>
                {(item: { value: string; label: string }) => (
                  <AutocompleteItem key={item.value} value={item}>
                    {item.label}
                  </AutocompleteItem>
                )}
              </AutocompleteCollection>
            </AutocompleteGroup>
            <AutocompleteGroup>
              <AutocompleteGroupLabel>Europe</AutocompleteGroupLabel>
              <AutocompleteCollection>
                {(item: { value: string; label: string }) => (
                  <AutocompleteItem key={item.value} value={item}>
                    {item.label}
                  </AutocompleteItem>
                )}
              </AutocompleteCollection>
            </AutocompleteGroup>
          </AutocompleteList>
        </AutocompletePopup>
      </Autocomplete>
    </div>
  ),
};
