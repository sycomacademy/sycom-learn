"use client";

import { useState } from "react";
import { Editor } from "@/components/editor/editor";
import type { EditorVariant } from "@/components/editor/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const variants: { variant: EditorVariant; description: string }[] = [
  { variant: "bare", description: "Keyboard shortcuts only — no toolbar" },
  {
    variant: "basic",
    description: "StarterKit toolbar with formatting, headings, lists, links",
  },
  {
    variant: "full",
    description:
      'All features: media, slash commands ("/"), custom blocks, bubble menu',
  },
];

export function EditorDemo() {
  const [readonly, setReadonly] = useState(false);

  return (
    <div className="grid w-full gap-10">
      <div className="flex items-center gap-3">
        <Switch
          checked={readonly}
          id="editor-readonly-toggle"
          onCheckedChange={setReadonly}
        />
        <Label htmlFor="editor-readonly-toggle">Readonly mode</Label>
      </div>

      {variants.map(({ variant, description }) => (
        <div className="grid gap-3" key={variant}>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{variant}</Badge>
            <span className="text-muted-foreground text-sm">{description}</span>
          </div>
          <Editor
            content={null}
            editable={!readonly}
            onUpdate={(content) => {
              console.log(`[${variant}] update:`, content);
            }}
            placeholder={
              variant === "full"
                ? 'Type "/" for commands...'
                : "Start writing..."
            }
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}
