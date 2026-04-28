import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Switch } from "@sycom/ui/components/switch";
import { toastManager } from "@sycom/ui/components/toast";
import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "next-themes";

import { useUser, useUserMutation } from "@/hooks/use-user";

const PREFERENCES_TOAST_ID = "preferences-update";
const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export const Route = createFileRoute("/dashboard/settings/preferences")({
  component: PreferencesSettings,
});

function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const {
    data: { profile },
  } = useUser();
  const { updateProfile } = useUserMutation();

  const currentSettings = profile.settings ?? {};
  const marketingEmails = currentSettings.marketingEmails ?? true;
  const useDeviceTimezone = currentSettings.useDeviceTimezone ?? true;
  const enableFacehash = currentSettings.enableFacehash ?? true;

  const updateSettings = async (nextSettings: PreferencesSettingsInput) => {
    try {
      await updateProfile.mutateAsync({
        settings: {
          ...currentSettings,
          ...nextSettings,
        },
      });

      toastManager.add({
        id: PREFERENCES_TOAST_ID,
        title: "Preferences updated",
        type: "success",
      });
    } catch {
      toastManager.add({
        id: PREFERENCES_TOAST_ID,
        title: "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleThemeChange = (value: string | null) => {
    if (!value) {
      return;
    }

    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
          <CardDescription className="text-sm">
            Choose how the app looks. Select a theme that suits your preference.
          </CardDescription>
        </CardHeader>
        <CardPanel className="pt-0">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Theme</p>
            <Select
              items={themeOptions}
              onValueChange={handleThemeChange}
              value={theme ?? "system"}
            >
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email preferences</CardTitle>
          <CardDescription className="text-sm">
            Control whether we send occasional welcome, product, and promotional emails.
          </CardDescription>
        </CardHeader>
        <CardPanel className="pt-0">
          <SettingRow
            checked={marketingEmails}
            description="Receive occasional welcome, product, and promotional emails from Sycom."
            disabled={updateProfile.isPending}
            onCheckedChange={(checked) => {
              void updateSettings({ marketingEmails: checked });
            }}
            title="Marketing emails"
          />
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">User preferences</CardTitle>
          <CardDescription className="text-sm">
            Configure timezone and avatar fallback behavior.
          </CardDescription>
        </CardHeader>
        <CardPanel className="pt-0">
          <div className="flex flex-col divide-y divide-border">
            <SettingRow
              checked={useDeviceTimezone}
              description="Automatically use your device timezone to personalize your experience."
              disabled={updateProfile.isPending}
              onCheckedChange={(checked) => {
                void updateSettings({ useDeviceTimezone: checked });
              }}
              title="Use device timezone"
            />
            <SettingRow
              checked={enableFacehash}
              description="If no profile picture is set, use FaceHash to generate a unique avatar."
              disabled={updateProfile.isPending}
              onCheckedChange={(checked) => {
                void updateSettings({ enableFacehash: checked });
              }}
              title="Enable FaceHash"
            />
          </div>
        </CardPanel>
      </Card>
    </div>
  );
}

type PreferencesSettingsInput = {
  marketingEmails?: boolean;
  useDeviceTimezone?: boolean;
  enableFacehash?: boolean;
};

function SettingRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex max-w-[80%] flex-col gap-0.5">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}
