import { shortcuts, type ShortcutId } from "@/lib/shortcuts/definitions";
import { getShortcutLabelById } from "@/lib/shortcuts/format";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Button } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";

type KeyboardShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DEFAULT_CATEGORY = "Global";

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const rows = (Object.keys(shortcuts) as ShortcutId[]).map((id) => ({
    id,
    category: shortcuts[id].category ?? DEFAULT_CATEGORY,
    description: shortcuts[id].description,
    label: getShortcutLabelById(id),
  }));

  rows.sort(
    (a, b) => a.category.localeCompare(b.category) || a.description.localeCompare(b.description),
  );

  const categories = [...new Set(rows.map((row) => row.category))];
  const rowsByCategory = rows.reduce<Record<string, typeof rows>>((groupedRows, row) => {
    groupedRows[row.category] ??= [];
    groupedRows[row.category].push(row);
    return groupedRows;
  }, {});

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="max-w-lg" showCloseButton>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Commands available across the dashboard. Press Escape to close this dialog.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="px-6 pb-2">
          <dl className="flex flex-col gap-4">
            {categories.map((category) => (
              <div key={category}>
                <dt className="mb-2 text-xs font-medium text-muted-foreground">{category}</dt>
                <dd>
                  <ul className="flex flex-col divide-y divide-border rounded-lg border bg-muted/40">
                    {rowsByCategory[category]?.map((row) => (
                      <li
                        className={cn(
                          "flex items-center gap-4 px-3 py-2.5 text-sm first:rounded-t-lg last:rounded-b-lg",
                        )}
                        key={row.id}
                      >
                        <span className="min-w-0 flex-1 text-foreground">{row.description}</span>
                        <kbd
                          className="shrink-0 rounded border bg-background px-2 py-0.5 font-sans text-xs font-medium tracking-widest text-muted-foreground"
                          translate="no"
                        >
                          {row.label}
                        </kbd>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </DialogPanel>
        <DialogFooter className="px-6 pb-6" variant="bare">
          <Button onClick={handleClose} type="button" variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
