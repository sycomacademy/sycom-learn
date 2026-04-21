import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../src/components/breadcrumb";
import { Button } from "../../src/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "../../src/components/card";
import { Field, FieldDescription, FieldLabel } from "../../src/components/field";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "../../src/components/frame";
import { Input } from "../../src/components/input";
import { Label } from "../../src/components/label";
import { Separator } from "../../src/components/separator";
import { Switch } from "../../src/components/switch";

function SettingsProfileScreen() {
  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border/60 bg-muted/24">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="https://example.com/settings">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update how you appear in the product. Changes here are for Storybook only.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
            <CardDescription>
              Your name and work email. Placeholder copy, no API calls.
            </CardDescription>
          </CardHeader>
          <CardPanel className="space-y-5 sm:px-6">
            <Field>
              <FieldLabel
                className="text-xs font-semibold text-muted-foreground"
                htmlFor="display-name"
              >
                Display name
              </FieldLabel>
              <FieldDescription>Shown on invites and the member list.</FieldDescription>
              <Input
                id="display-name"
                defaultValue="Jordan Park"
                autoComplete="name"
                placeholder="Your name"
              />
            </Field>
            <Field>
              <FieldLabel
                className="text-xs font-semibold text-muted-foreground"
                htmlFor="work-email"
              >
                Work email
              </FieldLabel>
              <FieldDescription>We send invoices and product updates here.</FieldDescription>
              <Input
                id="work-email"
                defaultValue="jordan@acme.tld"
                autoComplete="email"
                type="email"
                placeholder="you@company.com"
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground" htmlFor="title">
                Role title
              </FieldLabel>
              <FieldDescription>Optional. Shown in your public profile card.</FieldDescription>
              <Input id="title" defaultValue="Product designer" placeholder="e.g. Engineer" />
            </Field>
          </CardPanel>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t sm:px-6">
            <p className="text-xs text-muted-foreground">Last saved 2 minutes ago (mock).</p>
            <Button type="button">Save changes</Button>
          </CardFooter>
        </Card>

        <Frame>
          <FramePanel className="p-0">
            <FrameHeader className="px-5 pb-0">
              <FrameTitle>Visibility &amp; email</FrameTitle>
              <FrameDescription>
                Toggle how we reach you. These are static switches for the screen preview.
              </FrameDescription>
            </FrameHeader>
            <div className="space-y-1 px-5 py-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 space-y-1">
                  <Label className="text-sm" htmlFor="activity-email">
                    Product updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Occasional release notes and tips.
                  </p>
                </div>
                <Switch defaultChecked className="shrink-0" id="activity-email" />
              </div>
              <Separator className="my-4" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 space-y-1">
                  <Label className="text-sm" htmlFor="digest-email">
                    Weekly digest
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    A short summary of workspace activity.
                  </p>
                </div>
                <Switch className="shrink-0" id="digest-email" />
              </div>
              <Separator className="my-4" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 space-y-1">
                  <Label className="text-sm" htmlFor="public-profile">
                    Public directory listing
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Let other members find you by name.
                  </p>
                </div>
                <Switch defaultChecked className="shrink-0" id="public-profile" />
              </div>
            </div>
          </FramePanel>
        </Frame>
      </main>
    </div>
  );
}

const meta = {
  title: "Screens/Settings — Profile",
  component: SettingsProfileScreen,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SettingsProfileScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
