import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@sycom/ui/components/combobox";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "tanstack", label: "TanStack Router" },
  { value: "hono", label: "Hono" },
  { value: "drizzle", label: "Drizzle ORM" },
] as const;

type Framework = (typeof frameworks)[number];

const meta = {
  title: "Simple/Combobox",
  component: Combobox,
  tags: ["autodocs"],
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="w-72">
      <Combobox defaultOpen items={frameworks}>
        <ComboboxInput aria-label="Choose a framework" placeholder="Search frameworks…" />
        <ComboboxPopup>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList>
            {(item: Framework) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="w-96">
      <Combobox defaultOpen items={frameworks} multiple>
        <ComboboxChips>
          <ComboboxValue>
            {(selected: Framework[]) =>
              selected.map((item) => <ComboboxChip key={item.value}>{item.label}</ComboboxChip>)
            }
          </ComboboxValue>
          <ComboboxChipsInput aria-label="Add frameworks" placeholder="Add more…" />
        </ComboboxChips>
        <ComboboxPopup>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList>
            {(item: Framework) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
    </div>
  ),
};
