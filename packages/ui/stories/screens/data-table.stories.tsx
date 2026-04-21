import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, MoreHorizontal, Plus, Search, SlidersHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "../../src/components/avatar";
import { Badge } from "../../src/components/badge";
import { buttonVariants } from "../../src/components/button-variants";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "../../src/components/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../src/components/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../src/components/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "../../src/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../src/components/table";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../src/components/toolbar";
import { cn } from "../../src/lib/utils";

const members = [
  {
    id: "1",
    name: "Amelia Price",
    email: "amelia@acme.tld",
    role: "Admin",
    status: "active" as const,
  },
  {
    id: "2",
    name: "Noah Klimt",
    email: "noah@acme.tld",
    role: "Member",
    status: "invited" as const,
  },
  { id: "3", name: "Sam Rivera", email: "sam@acme.tld", role: "Member", status: "active" as const },
  {
    id: "4",
    name: "Elena Matsuo",
    email: "elena@acme.tld",
    role: "Billing",
    status: "active" as const,
  },
  {
    id: "5",
    name: "Ibrahim Cole",
    email: "ibrahim@acme.tld",
    role: "Member",
    status: "suspended" as const,
  },
];

const toolbarBtn = (className?: string) =>
  cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-7 gap-1.5 px-2 sm:h-7", className);

function statusBadge(s: (typeof members)[0]["status"]) {
  if (s === "active")
    return (
      <Badge className="font-normal" size="sm" variant="success">
        Active
      </Badge>
    );
  if (s === "invited")
    return (
      <Badge className="font-normal" size="sm" variant="info">
        Invited
      </Badge>
    );
  return (
    <Badge className="font-normal" size="sm" variant="error">
      Suspended
    </Badge>
  );
}

function DataTableScreen() {
  return (
    <div className="min-h-svh bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Composable table, toolbar, and filters — mock data only.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <CardTitle>Team members</CardTitle>
              <CardDescription>
                Manage seats, roles, and invitations. No requests are made from this story.
              </CardDescription>
            </div>
            <Toolbar className="w-full min-w-0 shrink-0 sm:max-w-md sm:justify-end">
              <ToolbarGroup>
                <ToolbarButton className={toolbarBtn()}>
                  <SlidersHorizontal className="size-3.5" />
                  View
                </ToolbarButton>
                <ToolbarButton className={toolbarBtn()}>
                  <Download className="size-3.5" />
                  Export
                </ToolbarButton>
                <ToolbarSeparator className="hidden min-h-6 sm:block" orientation="vertical" />
                <ToolbarButton
                  className={cn(
                    buttonVariants({ size: "sm", variant: "default" }),
                    "h-7 gap-1.5 px-2.5 sm:px-3",
                  )}
                >
                  <Plus className="size-3.5" />
                  Invite
                </ToolbarButton>
                <ToolbarButton
                  aria-label="More actions"
                  className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                >
                  <MoreHorizontal className="size-4" />
                </ToolbarButton>
              </ToolbarGroup>
            </Toolbar>
          </CardHeader>

          <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:max-w-2xl">
              <Select defaultValue="all">
                <SelectTrigger className="w-36" size="sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectPopup>
              </Select>
              <Select defaultValue="any">
                <SelectTrigger className="w-32" size="sm">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="any">Any role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                </SelectPopup>
              </Select>
            </div>
            <div className="w-full min-w-0 sm:ms-auto sm:max-w-xs sm:flex-1">
              <label className="sr-only" htmlFor="table-search">
                Search by name or email
              </label>
              <InputGroup className="w-full">
                <InputGroupAddon align="inline-start">
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput id="table-search" placeholder="Search…" size="sm" type="search" />
              </InputGroup>
            </div>
          </div>

          <CardPanel className="px-0 pt-0 sm:px-0">
            <Table variant="card">
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const initials = m.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex max-w-56 min-w-0 items-center gap-2.5">
                          <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 truncate font-medium text-foreground">
                            {m.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs min-w-48 truncate text-muted-foreground">
                        {m.email}
                      </TableCell>
                      <TableCell>{m.role}</TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardPanel>

          <CardFooter className="flex flex-col items-stretch gap-4 border-t sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-center text-xs text-muted-foreground sm:min-w-0 sm:text-start">
              Showing 1–5 of 28 members (placeholder range).
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="https://example.com/team?page=0"
                    onClick={(e) => e.preventDefault()}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="https://example.com/team?page=1"
                    isActive
                    onClick={(e) => e.preventDefault()}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="https://example.com/team?page=2"
                    onClick={(e) => e.preventDefault()}
                  >
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="https://example.com/team?page=3"
                    onClick={(e) => e.preventDefault()}
                  >
                    3
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="https://example.com/team?page=9"
                    onClick={(e) => e.preventDefault()}
                  >
                    9
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="https://example.com/team?page=2"
                    onClick={(e) => e.preventDefault()}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

const meta = {
  title: "Screens/Data table",
  component: DataTableScreen,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DataTableScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
