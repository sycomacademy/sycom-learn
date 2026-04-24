import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlertIcon, FolderIcon, PlusIcon } from "lucide-react";

import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sycom/ui/components/empty";
import { Field, FieldLabel } from "@sycom/ui/components/field";
import { Input } from "@sycom/ui/components/input";
import { Label } from "@sycom/ui/components/label";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Separator } from "@sycom/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sycom/ui/components/table";

/** Patterns align with [coss card particles](https://coss.com/ui/particles) (e.g. framed lists, header actions, auth shells). */
const meta = {
  title: "Simple/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Card, CardPanel (alias CardContent), and CardFrame primitives. CardFrame composes stacked `Card` children with a shared chrome—see **CardFrameWithTable** and **StackedCardsInFrame**.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

const frameworkItems = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
] as const;

const invoiceRows = [
  { id: "INV-001", customer: "Acme Co.", amount: "$250.00", status: "Paid" },
  { id: "INV-002", customer: "Globex", amount: "$180.00", status: "Pending" },
  { id: "INV-003", customer: "Initech", amount: "$920.00", status: "Paid" },
] as const;

export const Playground: Story = {
  render: (args) => (
    <Card {...args} className="w-sm">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Short description for the card contents.</CardDescription>
      </CardHeader>
      <CardContent>Body content goes here.</CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

/** Header action slot (`CardAction`) — same idea as coss `CardFrameAction` on a single card. */
export const WithHeaderAction: Story = {
  render: () => (
    <Card className="w-sm">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Mark read
          </Button>
        </CardAction>
      </CardHeader>
      <CardPanel className="text-sm text-muted-foreground">
        Latest: “Your export is ready.”
      </CardPanel>
    </Card>
  ),
};

/** Form-focused card (see coss particle `p-card-1`). Uses `CardPanel` for the main body. */
export const CreateProject: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
      </CardHeader>
      <CardPanel>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="card-project-name">Name</FieldLabel>
            <Input id="card-project-name" placeholder="My app" />
          </Field>
          <Field>
            <FieldLabel>Framework</FieldLabel>
            <Select defaultValue="vite" items={[...frameworkItems]}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {frameworkItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
        </div>
      </CardPanel>
      <CardFooter className="flex-col items-stretch gap-3 border-t">
        <Button>Deploy</Button>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <CircleAlertIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 opacity-80" />
          This will take a few seconds to complete.
        </p>
      </CardFooter>
    </Card>
  ),
};

/** Framed shell with header action and inner card + empty state (see coss `p-card-11`). */
export const CardFrameWithEmpty: Story = {
  render: () => (
    <CardFrame className="w-full max-w-lg">
      <CardFrameHeader>
        <CardFrameTitle>Projects</CardFrameTitle>
        <CardFrameDescription>Manage your projects</CardFrameDescription>
        <CardFrameAction>
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            Add
          </Button>
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="flex min-h-[220px] items-center justify-center py-0">
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderIcon aria-hidden className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>Get started by adding your first project.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardPanel>
      </Card>
    </CardFrame>
  ),
};

/** `CardFrame` wrapping a `Card` that holds a card-variant table (coss table + frame pattern). */
export const CardFrameWithTable: Story = {
  render: () => (
    <CardFrame className="w-full max-w-2xl">
      <CardFrameHeader>
        <CardFrameTitle>Invoices</CardFrameTitle>
        <CardFrameDescription>Recent billing activity for your workspace.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel className="pt-0">
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardPanel>
      </Card>
      <CardFrameFooter className="flex justify-end border-t">
        <Button size="sm" variant="outline">
          View all
        </Button>
      </CardFrameFooter>
    </CardFrame>
  ),
};

/** Multiple `Card` children inside one `CardFrame` (stacked sections). */
export const StackedCardsInFrame: Story = {
  render: () => (
    <CardFrame className="w-full max-w-md">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Billing</CardTitle>
          <CardDescription>Payment method on file</CardDescription>
        </CardHeader>
        <CardPanel className="text-sm">Visa ending in 4242</CardPanel>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Usage</CardTitle>
          <CardDescription>This billing period</CardDescription>
        </CardHeader>
        <CardPanel className="text-sm">12.4 GB egress · 3 seats</CardPanel>
      </Card>
    </CardFrame>
  ),
};

export const LoginCard: Story = {
  render: () => (
    <Card className="w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex w-full flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="card-email">Email</Label>
            <Input id="card-email" type="email" placeholder="m@example.com" autoComplete="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="card-password">Password</Label>
            <Input id="card-password" type="password" autoComplete="current-password" />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full">Login</Button>
        <Button className="w-full" variant="outline">
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  ),
};

/** Auth layout with OAuth first, then divider — similar to coss `p-card-3`. */
export const LoginWithSeparator: Story = {
  render: () => (
    <Card className="w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Sign up with GitHub or use your email.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button className="w-full" variant="outline">
          Continue with GitHub
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          <span className="shrink-0">Or continue with</span>
          <Separator className="flex-1" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="card-signup-email">Email</Label>
          <Input id="card-signup-email" type="email" autoComplete="email" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Sign up</Button>
      </CardFooter>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-2xl flex-wrap items-start gap-4">
      <Card className="min-w-48">
        <CardContent>Content only</CardContent>
      </Card>
      <Card className="min-w-48">
        <CardHeader>
          <CardTitle>Header only</CardTitle>
          <CardDescription>Description.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="min-w-48">
        <CardHeader>
          <CardTitle>Header + content</CardTitle>
        </CardHeader>
        <CardContent>Some content.</CardContent>
      </Card>
      <Card className="min-w-48">
        <CardHeader>
          <CardTitle>Full card</CardTitle>
          <CardDescription>Header, content, footer.</CardDescription>
        </CardHeader>
        <CardContent>Some content.</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    </div>
  ),
};
