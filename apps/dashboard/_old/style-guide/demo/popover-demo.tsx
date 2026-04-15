import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function PopoverDemo() {
  return (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Open popover</Button>}
        />
        <PopoverContent align="start" className="w-80">
          <div className="grid gap-4">
            <div>
              <PopoverTitle>Dimensions</PopoverTitle>
              <PopoverDescription>
                Set the dimensions for the layer.
              </PopoverDescription>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width">Width</Label>
                <Input
                  className="col-span-2 h-8"
                  defaultValue="100%"
                  id="width"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="maxWidth">Max. width</Label>
                <Input
                  className="col-span-2 h-8"
                  defaultValue="300px"
                  id="maxWidth"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="height">Height</Label>
                <Input
                  className="col-span-2 h-8"
                  defaultValue="25px"
                  id="height"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="maxHeight">Max. height</Label>
                <Input
                  className="col-span-2 h-8"
                  defaultValue="none"
                  id="maxHeight"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
