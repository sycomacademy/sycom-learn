"use client";

import { CheckIcon, XIcon } from "lucide-react";
import {
  Editable,
  EditableArea,
  EditableCancel,
  EditableInput,
  EditableLabel,
  EditablePreview,
  EditableSubmit,
  EditableToolbar,
} from "@/components/elements/editable";
import { Button } from "@/components/ui/button";

export function EditableDemo() {
  return (
    <div className="grid w-full max-w-sm gap-8">
      <Editable defaultValue="Click to edit" placeholder="Enter text...">
        <EditableLabel>Basic</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
      </Editable>

      <Editable defaultValue="With toolbar" placeholder="Enter text...">
        <EditableLabel>With controls</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
        <EditableToolbar>
          <EditableSubmit>
            <Button size="icon" variant="outline">
              <CheckIcon />
            </Button>
          </EditableSubmit>
          <EditableCancel>
            <Button size="icon" variant="outline">
              <XIcon />
            </Button>
          </EditableCancel>
        </EditableToolbar>
      </Editable>

      <Editable
        defaultValue="Double-click me"
        placeholder="Enter text..."
        triggerMode="dblclick"
      >
        <EditableLabel>Double-click trigger</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
      </Editable>

      <Editable defaultValue="Cannot edit" disabled>
        <EditableLabel>Disabled</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
      </Editable>
    </div>
  );
}
