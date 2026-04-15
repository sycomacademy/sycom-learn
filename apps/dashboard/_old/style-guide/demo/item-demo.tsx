import {
  ChevronRightIcon,
  DownloadIcon,
  PlusIcon,
  TicketIcon,
} from "lucide-react";
import Image from "next/image";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

const people = [
  {
    username: "shadcn",
    avatar: "https://github.com/shadcn.png",
    message: "Just shipped a component that fixes itself",
  },
  {
    username: "pranathip",
    avatar: "https://github.com/pranathip.png",
    message: "My code is so clean, it does its own laundry",
  },
  {
    username: "evilrabbit",
    avatar: "https://github.com/evilrabbit.png",
    message:
      "Debugging is like being a detective in a crime movie where you're also the murderer",
  },
  {
    username: "maxleiter",
    avatar: "https://github.com/maxleiter.png",
    message:
      "I don't always test my code, but when I do, I test it in production",
  },
];

const music = [
  {
    title: "Midnight City Lights",
    artist: "Neon Dreams",
    album: "Electric Nights",
    duration: "3:45",
  },
  {
    title: "Coffee Shop Conversations",
    artist: "The Morning Brew",
    album: "Urban Stories",
    duration: "4:05",
  },
  {
    title: "Digital Rain",
    artist: "Cyber Symphony",
    album: "Binary Beats",
    duration: "3:30",
  },
  {
    title: "Sunset Boulevard",
    artist: "Golden Hour",
    album: "California Dreams",
    duration: "3:55",
  },
  {
    title: "Neon Sign Romance",
    artist: "Retro Wave",
    album: "80s Forever",
    duration: "4:10",
  },
  {
    title: "Ocean Depths",
    artist: "Deep Blue",
    album: "Underwater Symphony",
    duration: "3:40",
  },
  {
    title: "Space Station Alpha",
    artist: "Cosmic Explorers",
    album: "Galactic Journey",
    duration: "3:50",
  },
  {
    title: "Forest Whispers",
    artist: "Nature's Choir",
    album: "Woodland Tales",
    duration: "3:35",
  },
];

const issues = [
  {
    number: 1247,
    date: "March 15, 2024",
    title:
      "Button component doesn't respect disabled state when using custom variants",
    description:
      "When applying custom variants to the Button component, the disabled prop is ignored and the button remains clickable. This affects accessibility and user experience.",
  },
  {
    number: 892,
    date: "February 8, 2024",
    title: "Dialog component causes scroll lock on mobile devices",
    description:
      "The Dialog component prevents scrolling on the background content but doesn't restore scroll position properly on mobile Safari and Chrome, causing layout shifts.",
  },
  {
    number: 1156,
    date: "January 22, 2024",
    title: "TypeScript errors with Select component in strict mode",
    description:
      "Using the Select component with TypeScript strict mode enabled throws type errors related to generic constraints and value prop typing.",
  },
  {
    number: 734,
    date: "December 3, 2023",
    title: "Dark mode toggle causes flash of unstyled content",
    description:
      "When switching between light and dark themes, there's a brief moment where components render with incorrect styling before the theme transition completes.",
  },
  {
    number: 1389,
    date: "April 2, 2024",
    title: "Form validation messages overlap with floating labels",
    description:
      "Error messages in Form components with floating labels appear underneath the label text, making them difficult to read. Need better positioning logic for validation feedback.",
  },
];

export function ItemDemo() {
  return (
    <div className="@container w-full">
      <div className="flex flex-wrap gap-6 2xl:gap-12">
        <div className="flex max-w-sm flex-col gap-6">
          <Item>
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="outline">Button</Button>
            </ItemActions>
          </Item>
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="outline">Button</Button>
            </ItemActions>
          </Item>
          <Item>
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
              <ItemDescription>Item Description</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline">Button</Button>
            </ItemActions>
          </Item>
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
              <ItemDescription>Item Description</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted">
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
              <ItemDescription>Item Description</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted">
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
              <ItemDescription>Item Description</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline">Button</Button>
              <Button variant="outline">Button</Button>
            </ItemActions>
          </Item>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <TicketIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button size="sm">Purchase</Button>
            </ItemActions>
          </Item>
          <Item variant="muted">
            <ItemMedia variant="icon">
              <TicketIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Item Title</ItemTitle>
              <ItemDescription>Item Description</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm">Upgrade</Button>
            </ItemActions>
          </Item>
          <FieldLabel>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Field Title</FieldTitle>
                <FieldDescription>Field Description</FieldDescription>
              </FieldContent>
              <Button variant="outline">Button</Button>
            </Field>
          </FieldLabel>
        </div>
        <div className="flex max-w-sm flex-col gap-6">
          <ItemGroup>
            {people.map((person, index) => (
              <React.Fragment key={person.username}>
                <Item>
                  <ItemMedia>
                    <Avatar>
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback>
                        {person.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{person.username}</ItemTitle>
                    <ItemDescription>{person.message}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      className="size-8 rounded-full"
                      size="icon"
                      variant="outline"
                    >
                      <PlusIcon />
                    </Button>
                  </ItemActions>
                </Item>
                {index !== people.length - 1 && <ItemSeparator />}
              </React.Fragment>
            ))}
          </ItemGroup>
          <Item variant="outline">
            <ItemMedia>
              <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale">
                <Avatar>
                  <AvatarImage
                    alt="@shadcn"
                    src="https://github.com/shadcn.png"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage
                    alt="@maxleiter"
                    src="https://github.com/maxleiter.png"
                  />
                  <AvatarFallback>LR</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage
                    alt="@evilrabbit"
                    src="https://github.com/evilrabbit.png"
                  />
                  <AvatarFallback>ER</AvatarFallback>
                </Avatar>
              </div>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Design Department</ItemTitle>
              <ItemDescription>
                Meet our team of designers, engineers, and researchers.
              </ItemDescription>
            </ItemContent>
            <ItemActions className="self-start">
              <Button
                className="size-8 rounded-full"
                size="icon"
                variant="outline"
              >
                <ChevronRightIcon />
              </Button>
            </ItemActions>
          </Item>
          <Item variant="outline">
            <ItemHeader>Your download has started.</ItemHeader>
            <ItemMedia variant="icon">
              <Spinner />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Downloading...</ItemTitle>
              <ItemDescription>129 MB / 1000 MB</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline">
                Cancel
              </Button>
            </ItemActions>
            <ItemFooter>
              <Progress value={50} />
            </ItemFooter>
          </Item>
        </div>
        <div className="flex max-w-lg flex-col gap-6">
          <ItemGroup className="gap-4">
            {music.map((song) => (
              <Item key={song.title} role="listitem" variant="outline">
                <a href="/">
                  <ItemMedia variant="image">
                    <Image
                      alt={song.title}
                      className="grayscale"
                      height={32}
                      src={`https://avatar.vercel.sh/${song.title}`}
                      width={32}
                    />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="line-clamp-1">
                      {song.title} -{" "}
                      <span className="text-muted-foreground">
                        {song.album}
                      </span>
                    </ItemTitle>
                    <ItemDescription>{song.artist}</ItemDescription>
                  </ItemContent>
                  <ItemContent className="flex-none text-center">
                    <ItemDescription>{song.duration}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      aria-label="Download"
                      className="size-8 rounded-full"
                      size="icon"
                      variant="ghost"
                    >
                      <DownloadIcon />
                    </Button>
                  </ItemActions>
                </a>
              </Item>
            ))}
          </ItemGroup>
        </div>
        <div className="flex max-w-lg flex-col gap-6">
          <ItemGroup>
            {issues.map((issue) => (
              <React.Fragment key={issue.number}>
                <Item className="rounded-none">
                  <a href="/">
                    <ItemContent>
                      <ItemTitle className="line-clamp-1">
                        {issue.title}
                      </ItemTitle>
                      <ItemDescription>{issue.description}</ItemDescription>
                    </ItemContent>
                    <ItemContent className="self-start">
                      #{issue.number}
                    </ItemContent>
                  </a>
                </Item>
                <ItemSeparator />
              </React.Fragment>
            ))}
          </ItemGroup>
        </div>
      </div>
    </div>
  );
}
