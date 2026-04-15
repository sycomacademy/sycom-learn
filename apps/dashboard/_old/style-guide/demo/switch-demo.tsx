import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SwitchDemo() {
  return (
    <div className="flex flex-col gap-6">
      {/* Sizes. */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch id="switch-demo-sm" size="sm" />
          <Label htmlFor="switch-demo-sm">Small</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="switch-demo-default" />
          <Label htmlFor="switch-demo-default">Default</Label>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-demo-airplane-mode" />
        <Label htmlFor="switch-demo-airplane-mode">Airplane Mode</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-600"
          defaultChecked
          id="switch-demo-bluetooth"
        />
        <Label htmlFor="switch-demo-bluetooth">Bluetooth</Label>
      </div>
      <Label className="flex items-center gap-6 rounded-lg border p-4 has-[[data-state=checked]]:border-blue-600">
        <div className="flex flex-col gap-1">
          <div className="font-medium">Share across devices</div>
          <div className="font-normal text-muted-foreground text-sm">
            Focus is shared across devices, and turns off when you leave the
            app.
          </div>
        </div>
        <Switch
          className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-600"
          id="switch-demo-focus-mode"
        />
      </Label>
    </div>
  );
}
