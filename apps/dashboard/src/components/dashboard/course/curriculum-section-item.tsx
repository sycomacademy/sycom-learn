import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@sycom/ui/components/button";
import { Collapsible, CollapsibleContent } from "@sycom/ui/components/collapsible";
import { SortableItem, SortableItemHandle } from "@sycom/ui/components/elements/sortable";
import { cn } from "@sycom/ui/lib/utils";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { memo } from "react";

import { CurriculumLessonItem } from "./curriculum-lesson-item";
import type { CurriculumSection } from "./curriculum-schema";

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
  onMoveLessonToSection: (lessonId: string, sectionId: string) => void;
  onSaveLessonContent: (
    lessonId: string,
    content: import("@tiptap/core").JSONContent | null,
  ) => Promise<void>;
  onToggleExpandedLesson: (lessonId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onUpdateLessonTitle: (lessonId: string, title: string) => Promise<void>;
  savingLessonId: string | null;
  section: CurriculumSection;
  sectionCollapsed: boolean;
  sections: CurriculumSection[];
};

function CurriculumSectionItemImpl({
  expandedLessonId,
  onCreateLesson,
  onMoveLessonToSection,
  onSaveLessonContent,
  onToggleExpandedLesson,
  onToggleSection,
  onUpdateLessonTitle,
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
              <p className="truncate text-sm font-semibold">{section.title}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"}
                </span>
                {section.openAt ? <span>Opens {section.openAt.toLocaleString()}</span> : null}
                {section.dueAt ? <span>Due {section.dueAt.toLocaleString()}</span> : null}
              </div>
            </div>

            <Button onClick={() => void onCreateLesson(section.id)} size="sm" variant="outline">
              <PlusIcon className="size-4" />
              Add lesson
            </Button>

            <Button
              aria-label="Delete section placeholder"
              disabled
              size="sm"
              title="Delete coming soon"
              variant="ghost"
            >
              <Trash2Icon className="size-4 text-muted-foreground" />
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
                          moveTargets={moveTargets}
                          onMoveToSection={onMoveLessonToSection}
                          onSaveContent={onSaveLessonContent}
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
