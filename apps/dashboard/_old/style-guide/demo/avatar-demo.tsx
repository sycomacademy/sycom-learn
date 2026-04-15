import { PlusIcon } from "lucide-react";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

export function AvatarDemo() {
  return (
    <div className="flex flex-col gap-6">
      {/* Sizes. */}
      <div className="flex flex-row flex-wrap items-center gap-4">
        <Avatar size="sm">
          <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      {/* Fallback. */}
      <div className="flex flex-row flex-wrap items-center gap-4">
        <Avatar size="sm">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      {/* With badge. */}
      <div className="flex flex-row flex-wrap items-center gap-4">
        <Avatar size="sm">
          <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <Avatar>
          <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <Avatar size="lg">
          <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
          <AvatarBadge>
            <PlusIcon />
          </AvatarBadge>
        </Avatar>
      </div>
      {/* Avatar group. */}
      <div className="flex flex-row flex-wrap items-center gap-4">
        <AvatarGroup>
          <Avatar size="sm">
            <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarImage
              alt="@maxleiter"
              src="https://github.com/maxleiter.png"
            />
            <AvatarFallback>ML</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarImage
              alt="@evilrabbit"
              src="https://github.com/evilrabbit.png"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </AvatarGroup>
        <AvatarGroup>
          <Avatar>
            <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              alt="@maxleiter"
              src="https://github.com/maxleiter.png"
            />
            <AvatarFallback>ML</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              alt="@evilrabbit"
              src="https://github.com/evilrabbit.png"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </AvatarGroup>
        <AvatarGroup>
          <Avatar size="lg">
            <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarImage
              alt="@maxleiter"
              src="https://github.com/maxleiter.png"
            />
            <AvatarFallback>ML</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarImage
              alt="@evilrabbit"
              src="https://github.com/evilrabbit.png"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </AvatarGroup>
      </div>
      {/* Avatar group with count. */}
      <div className="flex flex-row flex-wrap items-center gap-4">
        <AvatarGroup>
          <Avatar>
            <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              alt="@maxleiter"
              src="https://github.com/maxleiter.png"
            />
            <AvatarFallback>ML</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              alt="@evilrabbit"
              src="https://github.com/evilrabbit.png"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
        <AvatarGroup>
          <Avatar>
            <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              alt="@maxleiter"
              src="https://github.com/maxleiter.png"
            />
            <AvatarFallback>ML</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              alt="@evilrabbit"
              src="https://github.com/evilrabbit.png"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>
            <PlusIcon />
          </AvatarGroupCount>
        </AvatarGroup>
      </div>
    </div>
  );
}
