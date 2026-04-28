import { Button } from "@sycom/ui/components/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
} from "@sycom/ui/components/combobox";
import { SelectButton } from "@sycom/ui/components/select";
import { cn } from "@sycom/ui/lib/utils";
import { SearchIcon } from "lucide-react";

export interface FilterMultiComboboxItem {
  label: string;
  value: string;
}

interface FilterMultiComboboxProps {
  items: readonly FilterMultiComboboxItem[];
  value: string[];
  onChange: (value: string[]) => void;
  filterLabel: string;
  allLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
  resetLabel?: string;
  className?: string;
}

export function FilterMultiCombobox({
  items,
  value,
  onChange,
  filterLabel,
  allLabel,
  searchPlaceholder,
  emptyMessage,
  resetLabel = "Reset",
  className,
}: FilterMultiComboboxProps) {
  const selectedItems = items.filter((item) => value.includes(item.value));

  let displayText = allLabel;
  if (value.length === 1) {
    displayText = selectedItems[0]?.label ?? allLabel;
  } else if (value.length > 1) {
    displayText = `${value.length} selected`;
  }

  return (
    <Combobox
      autoHighlight
      isItemEqualToValue={(a, b) => a?.value === b?.value}
      items={[...items]}
      itemToStringLabel={(item) => item.label}
      multiple
      onValueChange={(nextItems: FilterMultiComboboxItem[]) => {
        const nextValue = nextItems.map((item) => item.value);
        onChange(nextValue.length === items.length ? [] : nextValue);
      }}
      value={selectedItems}
    >
      <ComboboxTrigger
        aria-label={`Filter by ${filterLabel.toLowerCase()}`}
        render={
          <SelectButton
            className={cn(
              "w-full justify-between gap-2 border-input font-normal sm:w-64",
              className,
            )}
            size="sm"
          />
        }
      >
        <span className="truncate">
          {filterLabel}: {displayText}
        </span>
      </ComboboxTrigger>
      <ComboboxPopup className="w-(--anchor-width) min-w-56" aria-label={filterLabel}>
        <div className="flex items-center gap-2 border-b p-2">
          <ComboboxInput
            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
            placeholder={searchPlaceholder}
            showTrigger={false}
            startAddon={<SearchIcon />}
          />
          {value.length > 0 ? (
            <Button
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onChange([])}
              size="sm"
              type="button"
              variant="ghost"
            >
              {resetLabel}
            </Button>
          ) : null}
        </div>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: FilterMultiComboboxItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
