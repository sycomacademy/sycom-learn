"use client";

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  AudioLinesIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  GitGraphIcon,
  HeartIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PercentIcon,
  PinIcon,
  PlusIcon,
  RotateCwIcon,
  SearchIcon,
  ShareIcon,
  TrashIcon,
  UserRoundIcon,
  UserRoundXIcon,
  VolumeOffIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ButtonGroupDemo() {
  const [currency, setCurrency] = useState("$");
  return (
    <div className="flex flex-wrap gap-20">
      <div className="flex max-w-sm flex-col gap-6">
        <ButtonGroup>
          <Button>Button</Button>
          <Button>
            Get Started <ArrowRightIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button>Button</Button>
          <ButtonGroupSeparator className="bg-primary/80" />
          <Button>
            Get Started <ArrowRightIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">Button</Button>
          <Input placeholder="Type something here..." />
        </ButtonGroup>
        <ButtonGroup>
          <Input placeholder="Type something here..." />
          <Button variant="outline">Button</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">Button</Button>
          <Button variant="outline">Another Button</Button>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>Text</ButtonGroupText>
          <Button variant="outline">Another Button</Button>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>
            <Label htmlFor="input">GPU Size</Label>
          </ButtonGroupText>
          <Input id="input" placeholder="Type something here..." />
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>Prefix</ButtonGroupText>
          <Input id="input" placeholder="Type something here..." />
          <ButtonGroupText>Suffix</ButtonGroupText>
        </ButtonGroup>
        <div className="flex flex-wrap gap-4">
          <ButtonGroup>
            <Button variant="outline">Update</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline">
                    <ChevronDownIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Disable</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  Uninstall
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <ButtonGroup className="[--radius:9999px]">
            <Button variant="outline">Follow</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className="pl-2!" variant="outline">
                    <ChevronDownIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="[--radius:0.95rem]">
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <VolumeOffIcon />
                    Mute Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CheckIcon />
                    Mark as Read
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <AlertTriangleIcon />
                    Report Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserRoundXIcon />
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ShareIcon />
                    Share Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CopyIcon />
                    Copy Conversation
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive">
                    <TrashIcon />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <ButtonGroup className="[--radius:0.9rem]">
            <Button variant="secondary">Actions</Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="secondary">
                    <MoreHorizontalIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="[--radius:0.9rem]">
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <CheckIcon />
                    Select Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <PinIcon />
                    Edit Pins
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserRoundIcon />
                    Set Up Name & Photo
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
        <Field>
          <Label htmlFor="amount">Amount</Label>
          <ButtonGroup>
            <Select
              onValueChange={(value) => setCurrency(value as string)}
              value={currency}
            >
              <SelectTrigger className="h-10 font-mono">
                {currency}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$</SelectItem>
                <SelectItem value="€">€</SelectItem>
                <SelectItem value="£">£</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Enter amount to send" />
            <Button size={"icon"} variant="outline">
              <ArrowRightIcon />
            </Button>
          </ButtonGroup>
        </Field>
      </div>
      <div className="flex max-w-xs flex-col gap-6">
        <ButtonGroup className="[--spacing:0.2rem]">
          <Button variant="outline">
            <FlipHorizontalIcon />
          </Button>
          <Button variant="outline">
            <FlipVerticalIcon />
          </Button>
          <Button variant="outline">
            <RotateCwIcon />
          </Button>
          <InputGroup>
            <InputGroupInput placeholder="0.00" />
            <InputGroupAddon
              align="inline-end"
              className="text-muted-foreground"
            >
              <PercentIcon />
            </InputGroupAddon>
          </InputGroup>
        </ButtonGroup>
        <div className="flex gap-2 [--radius:0.95rem] [--ring:var(--color-blue-300)] [--spacing:0.22rem] **:[.shadow-xs]:shadow-none">
          <InputGroup>
            <InputGroupInput placeholder="Type to search..." />
            <InputGroupAddon
              align="inline-start"
              className="text-muted-foreground"
            >
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <ButtonGroup>
            <Button variant="outline">
              <GitGraphIcon />
            </Button>
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="outline">
                    <ChevronDownIcon />
                  </Button>
                }
              />
              <PopoverContent align="end" className="rounded-xl p-0 text-sm">
                <div className="px-4 py-3">
                  <div className="font-medium text-sm">Agent Tasks</div>
                </div>
                <Separator />
                <div className="p-4 *:[p:not(:last-child)]:mb-2">
                  <Textarea
                    className="mb-4 resize-none"
                    placeholder="Describe your task in natural language."
                  />
                  <p className="font-medium">Start a new task with Copilot</p>
                  <p className="text-muted-foreground">
                    Describe your task in natural language. Copilot will work in
                    the background and open a pull request for your review.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </ButtonGroup>
        </div>
        <FieldGroup className="grid grid-cols-2 gap-4 [--spacing:0.22rem]">
          <Field>
            <Label htmlFor="width">Width</Label>
            <ButtonGroup>
              <InputGroup>
                <InputGroupInput id="width" />
                <InputGroupAddon className="text-muted-foreground">
                  W
                </InputGroupAddon>
                <InputGroupAddon
                  align="inline-end"
                  className="text-muted-foreground"
                >
                  px
                </InputGroupAddon>
              </InputGroup>
              <Button size="icon" variant="outline">
                <MinusIcon />
              </Button>
              <Button size="icon" variant="outline">
                <PlusIcon />
              </Button>
            </ButtonGroup>
          </Field>
          <Field className="w-full">
            <Label htmlFor="color">Color</Label>
            <ButtonGroup className="w-full">
              <InputGroup>
                <InputGroupInput id="color" />
                <InputGroupAddon align="inline-start">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <InputGroupButton>
                          <span className="size-4 rounded-xs bg-blue-600" />
                        </InputGroupButton>
                      }
                    />
                    <PopoverContent
                      align="start"
                      alignOffset={-8}
                      className="max-w-48 rounded-lg p-2"
                      sideOffset={8}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "#EA4335", // Red
                          "#FBBC04", // Yellow
                          "#34A853", // Green
                          "#4285F4", // Blue
                          "#9333EA", // Purple
                          "#EC4899", // Pink
                          "#10B981", // Emerald
                          "#F97316", // Orange
                          "#6366F1", // Indigo
                          "#14B8A6", // Teal
                          "#8B5CF6", // Violet
                          "#F59E0B", // Amber
                        ].map((color) => (
                          <div
                            className="size-6 cursor-pointer rounded-sm transition-transform hover:scale-110"
                            key={color}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </InputGroupAddon>
                <InputGroupAddon
                  align="inline-end"
                  className="text-muted-foreground"
                >
                  %
                </InputGroupAddon>
              </InputGroup>
            </ButtonGroup>
          </Field>
        </FieldGroup>
        <ButtonGroup>
          <Button variant="outline">
            <HeartIcon /> Like
          </Button>
          <Button
            nativeButton={false}
            render={
              <span className="pointer-events-none px-2 text-muted-foreground">
                1.2K
              </span>
            }
            variant="outline"
          />
        </ButtonGroup>
        <ExportButtonGroup />
        <ButtonGroup>
          <Select defaultValue="hours">
            <SelectTrigger id="duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
            </SelectContent>
          </Select>
          <Input />
        </ButtonGroup>
        <ButtonGroup className="[--radius:9999rem]">
          <ButtonGroup>
            <Button size="icon" variant="outline">
              <PlusIcon />
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <InputGroup>
              <InputGroupInput placeholder="Send a message..." />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupAddon align="inline-end">
                      <AudioLinesIcon />
                    </InputGroupAddon>
                  }
                />
                <TooltipContent>Voice Mode</TooltipContent>
              </Tooltip>
            </InputGroup>
          </ButtonGroup>
        </ButtonGroup>
        <ButtonGroup>
          <Button size="sm" variant="outline">
            <ArrowLeftIcon />
            Previous
          </Button>
          <Button size="sm" variant="outline">
            1
          </Button>
          <Button size="sm" variant="outline">
            2
          </Button>
          <Button size="sm" variant="outline">
            3
          </Button>
          <Button size="sm" variant="outline">
            4
          </Button>
          <Button size="sm" variant="outline">
            5
          </Button>
          <Button size="sm" variant="outline">
            Next
            <ArrowRightIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup className="[--radius:0.9rem] [--spacing:0.22rem]">
          <ButtonGroup>
            <Button variant="outline">1</Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">4</Button>
            <Button variant="outline">5</Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button size="icon" variant="outline">
              <ArrowLeftIcon />
            </Button>
            <Button size="icon" variant="outline">
              <ArrowRightIcon />
            </Button>
          </ButtonGroup>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroup>
            <Button variant="outline">
              <ArrowLeftIcon />
            </Button>
            <Button variant="outline">
              <ArrowRightIcon />
            </Button>
          </ButtonGroup>
          <ButtonGroup aria-label="Single navigation button">
            <Button size="icon" variant="outline">
              <ArrowLeftIcon />
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
      <div className="flex max-w-xs flex-col gap-6">
        <Field>
          <Label id="alignment-label">Text Alignment</Label>
          <ButtonGroup aria-labelledby="alignment-label">
            <Button size="sm" variant="outline">
              Left
            </Button>
            <Button size="sm" variant="outline">
              Center
            </Button>
            <Button size="sm" variant="outline">
              Right
            </Button>
            <Button size="sm" variant="outline">
              Justify
            </Button>
          </ButtonGroup>
        </Field>
        <div className="flex gap-6">
          <ButtonGroup
            aria-label="Media controls"
            className="h-fit"
            orientation="vertical"
          >
            <Button size="icon" variant="outline">
              <PlusIcon />
            </Button>
            <Button size="icon" variant="outline">
              <MinusIcon />
            </Button>
          </ButtonGroup>
          <ButtonGroup aria-label="Design tools palette" orientation="vertical">
            <ButtonGroup orientation="vertical">
              <Button size="icon" variant="outline">
                <SearchIcon />
              </Button>
              <Button size="icon" variant="outline">
                <CopyIcon />
              </Button>
              <Button size="icon" variant="outline">
                <ShareIcon />
              </Button>
            </ButtonGroup>
            <ButtonGroup orientation="vertical">
              <Button size="icon" variant="outline">
                <FlipHorizontalIcon />
              </Button>
              <Button size="icon" variant="outline">
                <FlipVerticalIcon />
              </Button>
              <Button size="icon" variant="outline">
                <RotateCwIcon />
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button size="icon" variant="outline">
                <TrashIcon />
              </Button>
            </ButtonGroup>
          </ButtonGroup>
          <ButtonGroup orientation="vertical">
            <Button size="sm" variant="outline">
              <PlusIcon /> Increase
            </Button>
            <Button size="sm" variant="outline">
              <MinusIcon /> Decrease
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
}

function ExportButtonGroup() {
  const [exportType, setExportType] = useState("pdf");

  return (
    <ButtonGroup>
      <Input />
      <Select
        onValueChange={(value) => setExportType(value ?? "")}
        value={exportType}
      >
        <SelectTrigger>
          <SelectValue>{exportType}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="pdf">pdf</SelectItem>
          <SelectItem value="xlsx">xlsx</SelectItem>
          <SelectItem value="csv">csv</SelectItem>
          <SelectItem value="json">json</SelectItem>
        </SelectContent>
      </Select>
    </ButtonGroup>
  );
}
