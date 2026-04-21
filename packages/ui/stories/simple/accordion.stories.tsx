import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@sycom/ui/components/accordion";

const meta = {
  title: "Simple/Accordion",
  component: Accordion,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Accordion {...args} className="w-full max-w-md" defaultValue={["item-1"]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is included?</AccordionTrigger>
        <AccordionPanel>Documentation, examples, and support during onboarding.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I cancel?</AccordionTrigger>
        <AccordionPanel>
          You can cancel anytime from billing settings. Access ends at period close.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion className="w-full max-w-md" defaultValue={["a", "b"]} multiple>
      <AccordionItem value="a">
        <AccordionTrigger>Section A</AccordionTrigger>
        <AccordionPanel>Content for section A.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Section B</AccordionTrigger>
        <AccordionPanel>Content for section B.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

export const AllClosed: Story = {
  render: () => (
    <Accordion className="w-full max-w-md" defaultValue={[]}>
      <AccordionItem value="1">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionPanel>Hidden until expanded.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};
