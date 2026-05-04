import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@sycom/ui/components/button";
import { Calendar } from "@sycom/ui/components/calendar";
import { Collapsible, CollapsibleContent } from "@sycom/ui/components/collapsible";
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
} from "@sycom/ui/components/elements/editable";
import { SortableItem, SortableItemHandle } from "@sycom/ui/components/elements/sortable";
import { Input } from "@sycom/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@sycom/ui/components/popover";
import { cn } from "@sycom/ui/lib/utils";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { memo, useMemo } from "react";

import { CurriculumLessonItem } from "./curriculum-lesson-item";
import type { CurriculumSection } from "./curriculum-schema";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

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

function SectionDateTimeField({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: Date | null) => void;
  value: Date | null;
}) {
  const displayLabel = useMemo(
    () => (value ? dateTimeFormatter.format(value) : label),
    [label, value],
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className={cn("text-xs font-normal", !value && "text-muted-foreground")}
            size="sm"
            variant="outline"
          />
        }
      >
        <CalendarIcon className="size-4" />
        {displayLabel}
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

function EmptySectionDroppable({ sectionId }: { sectionId: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `empty-section:${sectionId}`,
    data: { type: "empty-section", sectionId },
  });

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border border-dashed px-4 py-6 text-center text-xs text-muted-foreground transition-colors",
        isOver && "border-primary bg-primary/5 text-primary",
      )}
      ref={setNodeRef}
    >
      {isOver ? "Release to drop here" : "No lessons yet. Create one or drag a lesson here."}
    </div>
  );
}

type CurriculumSectionItemProps = {
  expandedLessonId: string | null;
  onCreateLesson: (sectionId: string) => Promise<void>;
  onDeleteLesson: (lessonId: string) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onMoveLessonToSection: (lessonId: string, sectionId: string) => void;
  onSaveLesson: (
    lessonId: string,
    patch: {
      content: import("@tiptap/core").JSONContent | null;
      dueAt: Date | null;
      openAt: Date | null;
      type: CurriculumSection["lessons"][number]["type"];
    },
    options?: { silent?: boolean },
  ) => Promise<void>;
  onUpdateSectionSchedule: (
    sectionId: string,
    patch: { dueAt?: Date | null; openAt?: Date | null },
  ) => Promise<void>;
  onToggleExpandedLesson: (lessonId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onUpdateLessonTitle: (lessonId: string, title: string) => Promise<void>;
  onUpdateSectionTitle: (sectionId: string, title: string) => Promise<void>;
  savingLessonId: string | null;
  section: CurriculumSection;
  sectionCollapsed: boolean;
  sections: CurriculumSection[];
};

function CurriculumSectionItemImpl({
  expandedLessonId,
  onCreateLesson,
  onDeleteLesson,
  onDeleteSection,
  onMoveLessonToSection,
  onSaveLesson,
  onUpdateSectionSchedule,
  onToggleExpandedLesson,
  onToggleSection,
  onUpdateLessonTitle,
  onUpdateSectionTitle,
  savingLessonId,
  section,
  sectionCollapsed,
  sections,
}: CurriculumSectionItemProps) {
  const moveTargets = sections.filter((candidate) => candidate.id !== section.id);

  return (
    <SortableItem value={section.id}>
      <div className="border bg-card shadow-xs/5">
        <Collapsible open={!sectionCollapsed}>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <SortableItemHandle className="shrink-0 touch-none text-muted-foreground hover:text-foreground">
              <GripVerticalIcon className="size-4" />
            </SortableItemHandle>

            <button
              aria-label={sectionCollapsed ? "Expand section" : "Collapse section"}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onToggleSection(section.id)}
              type="button"
            >
              {sectionCollapsed ? (
                <ChevronRightIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <Editable
                className="min-w-0"
                onSubmit={(value) => {
                  const trimmedValue = value.trim();
                  if (trimmedValue && trimmedValue !== section.title) {
                    void onUpdateSectionTitle(section.id, trimmedValue);
                  }
                }}
                value={section.title}
              >
                <EditableArea className="w-full">
                  <EditablePreview className="truncate text-sm font-semibold hover:text-foreground" />
                  <EditableInput className="h-8 w-full rounded-md border px-2 text-sm font-semibold" />
                </EditableArea>
              </Editable>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <SectionDateTimeField
              label="Open at"
              onValueChange={(openAt) => void onUpdateSectionSchedule(section.id, { openAt })}
              value={section.openAt}
            />

            <SectionDateTimeField
              label="Due at"
              onValueChange={(dueAt) => void onUpdateSectionSchedule(section.id, { dueAt })}
              value={section.dueAt}
            />

            <Button onClick={() => void onCreateLesson(section.id)} size="sm" variant="outline">
              <PlusIcon className="size-4" />
              Add lesson
            </Button>

            <Button
              aria-label="Delete section"
              onClick={() => void onDeleteSection(section.id)}
              size="sm"
              variant="ghost"
            >
              <Trash2Icon className="size-4 text-destructive" />
            </Button>
          </div>

          <CollapsibleContent>
            <div className="border-t px-4 py-4">
              <SortableContext
                items={section.lessons.map((lesson) => lesson.id)}
                strategy={verticalListSortingStrategy}
              >
                {section.lessons.length === 0 ? (
                  <EmptySectionDroppable sectionId={section.id} />
                ) : (
                  <div className="space-y-2">
                    {section.lessons.map((lesson) => (
                      <SortableItem
                        className="data-[dragging=true]:opacity-100 data-[dragging=true]:shadow-md"
                        key={lesson.id}
                        value={lesson.id}
                      >
                        <CurriculumLessonItem
                          expanded={expandedLessonId === lesson.id}
                          lesson={lesson}
                          onDeleteLesson={onDeleteLesson}
                          moveTargets={moveTargets}
                          onMoveToSection={onMoveLessonToSection}
                          onSaveLesson={onSaveLesson}
                          onToggleExpanded={onToggleExpandedLesson}
                          onUpdateTitle={onUpdateLessonTitle}
                          saving={savingLessonId === lesson.id}
                        />
                      </SortableItem>
                    ))}
                  </div>
                )}
              </SortableContext>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SortableItem>
  );
}

export const CurriculumSectionItem = memo(CurriculumSectionItemImpl);
