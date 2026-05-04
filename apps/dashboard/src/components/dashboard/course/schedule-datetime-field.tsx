"use client";

import { Button } from "@sycom/ui/components/button";
import { Calendar } from "@sycom/ui/components/calendar";
import { Input } from "@sycom/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@sycom/ui/components/popover";
import { cn } from "@sycom/ui/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useMemo } from "react";

function formatTimeInputValue(value: Date | null) {
  if (!value) return "";

  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function setDateTimePart(base: Date | null, nextDate: Date | null, timeValue?: string) {
  if (!nextDate) return null;

  const next = new Date(nextDate);
  const [hours, minutes] = (timeValue ?? formatTimeInputValue(base)).split(":");
  next.setHours(Number.parseInt(hours || "0", 10), Number.parseInt(minutes || "0", 10), 0, 0);
  return next;
}

function setTimePart(base: Date | null, timeValue: string) {
  if (!base) return null;

  const next = new Date(base);
  const [hours, minutes] = timeValue.split(":");
  next.setHours(Number.parseInt(hours || "0", 10), Number.parseInt(minutes || "0", 10), 0, 0);
  return next;
}

export function ScheduleDateTimeField({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: Date | null) => void;
  value: Date | null;
}) {
  const { viewerTimeZone, localDateTimeFormatter, utcDateTimeFormatter } = useMemo(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const opts: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    };
    return {
      viewerTimeZone: timeZone,
      localDateTimeFormatter: new Intl.DateTimeFormat("en-US", { ...opts, timeZone }),
      utcDateTimeFormatter: new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }),
    };
  }, []);

  const displayLabel = useMemo(
    () => (value ? localDateTimeFormatter.format(value) : label),
    [label, value, localDateTimeFormatter],
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className={cn("text-xs font-normal", !value && "text-muted-foreground")}
            size="sm"
            title={
              value
                ? `${localDateTimeFormatter.format(value)} (${viewerTimeZone}). Stored as UTC: ${utcDateTimeFormatter.format(value)}. Learners see their local time.`
                : undefined
            }
            variant="outline"
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{displayLabel}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex flex-col gap-3 p-3">
          <Calendar
            mode="single"
            numberOfMonths={1}
            onSelect={(nextDate) => onValueChange(setDateTimePart(value, nextDate ?? null))}
            selected={value ?? undefined}
          />
          <div className="flex items-center gap-2">
            <Input
              className="w-28"
              disabled={!value}
              nativeInput
              onChange={(event) => onValueChange(setTimePart(value, event.currentTarget.value))}
              type="time"
              value={formatTimeInputValue(value)}
            />
            <Button disabled={!value} onClick={() => onValueChange(null)} size="sm" variant="ghost">
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
