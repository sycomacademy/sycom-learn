import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@sycom/ui/components/button";
import { toastManager } from "@sycom/ui/components/toast";
import { PlusIcon } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import { startTransition, useEffect, useMemo, useState } from "react";

import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

import { CurriculumSectionItem } from "./curriculum-section-item";
import { cloneCurriculumSections, type CurriculumSection } from "./curriculum-schema";

function moveLessonAcrossSections(
  sections: CurriculumSection[],
  lessonId: string,
  targetSectionId: string,
  overLessonId?: string,
) {
  const sourceSection = sections.find((section) =>
    section.lessons.some((lesson) => lesson.id === lessonId),
  );
  const targetSection = sections.find((section) => section.id === targetSectionId);
  const lesson = sourceSection?.lessons.find((item) => item.id === lessonId);

  if (!(sourceSection && targetSection && lesson)) {
    return sections;
  }

  const nextSections = cloneCurriculumSections(sections);
  const nextSourceSection = nextSections.find((section) => section.id === sourceSection.id);
  const nextTargetSection = nextSections.find((section) => section.id === targetSection.id);

  if (!(nextSourceSection && nextTargetSection)) {
    return sections;
  }

  nextSourceSection.lessons = nextSourceSection.lessons.filter((item) => item.id !== lessonId);

  const nextLesson = { ...lesson, sectionId: targetSectionId };
  if (!overLessonId) {
    nextTargetSection.lessons.push(nextLesson);
    return nextSections;
  }

  const overIndex = nextTargetSection.lessons.findIndex((item) => item.id === overLessonId);
  if (overIndex === -1) {
    nextTargetSection.lessons.push(nextLesson);
    return nextSections;
  }

  nextTargetSection.lessons.splice(overIndex, 0, nextLesson);
  return nextSections;
}

export function CurriculumBoard({ courseId }: { courseId: string }) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const queryKey = trpc.course.getCurriculum.queryKey({ courseId });
  const { data: curriculum } = useSuspenseQuery(
    trpc.course.getCurriculum.queryOptions({ courseId }),
  );

  const [sections, setSections] = useState(() => cloneCurriculumSections(curriculum));
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(new Set());
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);

  useEffect(() => {
    setSections(cloneCurriculumSections(curriculum));
  }, [curriculum]);

  const setCurriculum = (updater: (current: CurriculumSection[]) => CurriculumSection[]) => {
    setSections((current) => updater(cloneCurriculumSections(current)));
    queryClient.setQueryData<CurriculumSection[]>(queryKey, (current) => {
      if (!current) return current;
      return updater(cloneCurriculumSections(current));
    });
  };

  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const lessonIds = useMemo(
    () => sections.flatMap((section) => section.lessons.map((lesson) => lesson.id)),
    [sections],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleCreateSection = async () => {
    try {
      const created = await trpcClient.course.createSection.mutate({
        courseId,
        title: `Section ${sections.length + 1}`,
      });
      setCurriculum((current) => [...current, created]);
      setCollapsedSectionIds((current) => {
        const next = new Set(current);
        next.delete(created.id);
        return next;
      });
      toastManager.add({ title: "Section created", type: "success" });
    } catch (error) {
      toastManager.add({
        title: "Couldn't create section",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleCreateLesson = async (sectionId: string) => {
    try {
      const targetSection = sections.find((section) => section.id === sectionId);
      const created = await trpcClient.lesson.create.mutate({
        courseId,
        sectionId,
        title: `Lesson ${(targetSection?.lessons.length ?? 0) + 1}`,
      });
      setCurriculum((current) =>
        current.map((section) =>
          section.id === sectionId
            ? { ...section, lessons: [...section.lessons, created] }
            : section,
        ),
      );
      setCollapsedSectionIds((current) => {
        const next = new Set(current);
        next.delete(sectionId);
        return next;
      });
      startTransition(() => {
        setExpandedLessonId(created.id);
      });
      toastManager.add({ title: "Lesson created", type: "success" });
    } catch (error) {
      toastManager.add({
        title: "Couldn't create lesson",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleUpdateLessonTitle = async (lessonId: string, title: string) => {
    const previousSections = cloneCurriculumSections(sections);
    setCurriculum((current) =>
      current.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, title } : lesson,
        ),
      })),
    );

    try {
      await trpcClient.lesson.update.mutate({ lessonId, patch: { title } });
      toastManager.add({ title: "Lesson updated", type: "success" });
    } catch (error) {
      setSections(previousSections);
      queryClient.setQueryData(queryKey, previousSections);
      toastManager.add({
        title: "Couldn't update lesson",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleSaveLessonContent = async (lessonId: string, content: JSONContent | null) => {
    const previousSections = cloneCurriculumSections(sections);
    setSavingLessonId(lessonId);
    setCurriculum((current) =>
      current.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, content, updatedAt: new Date() } : lesson,
        ),
      })),
    );

    try {
      await trpcClient.lesson.update.mutate({ lessonId, patch: { content } });
      toastManager.add({ title: "Lesson saved", type: "success" });
    } catch (error) {
      setSections(previousSections);
      queryClient.setQueryData(queryKey, previousSections);
      toastManager.add({
        title: "Couldn't save lesson",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setSavingLessonId((current) => (current === lessonId ? null : current));
    }
  };

  const handleToggleSection = (sectionId: string) => {
    startTransition(() => {
      setCollapsedSectionIds((current) => {
        const next = new Set(current);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        return next;
      });
    });
  };

  const handleMoveLessonToSection = (lessonId: string, sectionId: string) => {
    setCurriculum((current) => moveLessonAcrossSections(current, lessonId, sectionId));
    setCollapsedSectionIds((current) => {
      const next = new Set(current);
      next.delete(sectionId);
      return next;
    });
    toastManager.add({
      title: "Local move only",
      description:
        "Cross-section moves are visible now, but persistence lands in the next server pass.",
      type: "warning",
    });
  };

  const handleMoveLessonWithinBoard = (
    lessonId: string,
    targetSectionId: string,
    overLessonId?: string,
  ) => {
    setCurriculum((current) =>
      moveLessonAcrossSections(current, lessonId, targetSectionId, overLessonId),
    );
    setCollapsedSectionIds((current) => {
      const next = new Set(current);
      next.delete(targetSectionId);
      return next;
    });
    toastManager.add({
      title: "Local move only",
      description:
        "Cross-section moves are visible now, but persistence lands in the next server pass.",
      type: "warning",
    });
  };

  const handleDragStart = (_event: DragStartEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (sectionIds.includes(activeId)) {
      if (!sectionIds.includes(overId) || activeId === overId) return;

      setCurriculum((current) => {
        const oldIndex = current.findIndex((section) => section.id === activeId);
        const newIndex = current.findIndex((section) => section.id === overId);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return current;
        return arrayMove(current, oldIndex, newIndex);
      });

      toastManager.add({
        title: "Local reorder only",
        description: "Section order changes are currently local until reorder routes are added.",
        type: "warning",
      });
      return;
    }

    if (!lessonIds.includes(activeId)) return;

    const sourceSection = sections.find((section) =>
      section.lessons.some((lesson) => lesson.id === activeId),
    );
    if (!sourceSection) return;

    const overType = over.data.current?.type;
    if (overType === "empty-section") {
      const targetSectionId = String(over.data.current?.sectionId ?? "");
      if (targetSectionId && targetSectionId !== sourceSection.id) {
        handleMoveLessonToSection(activeId, targetSectionId);
      }
      return;
    }

    if (lessonIds.includes(overId)) {
      const targetSection = sections.find((section) =>
        section.lessons.some((lesson) => lesson.id === overId),
      );
      if (!targetSection) return;

      if (targetSection.id === sourceSection.id) {
        setCurriculum((current) =>
          current.map((section) => {
            if (section.id !== sourceSection.id) return section;
            const oldIndex = section.lessons.findIndex((lesson) => lesson.id === activeId);
            const newIndex = section.lessons.findIndex((lesson) => lesson.id === overId);
            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return section;
            return { ...section, lessons: arrayMove(section.lessons, oldIndex, newIndex) };
          }),
        );

        toastManager.add({
          title: "Local reorder only",
          description: "Lesson order changes are currently local until reorder routes are added.",
          type: "warning",
        });
        return;
      }

      handleMoveLessonWithinBoard(activeId, targetSection.id, overId);
      return;
    }

    if (sectionIds.includes(overId) && overId !== sourceSection.id) {
      handleMoveLessonWithinBoard(activeId, overId);
    }
  };

  return (
    <div className="space-y-4">
      <DndContext
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        {sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            No sections yet. Create your first section to start authoring.
          </div>
        ) : (
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sections.map((section) => (
                <CurriculumSectionItem
                  expandedLessonId={expandedLessonId}
                  key={section.id}
                  onCreateLesson={handleCreateLesson}
                  onMoveLessonToSection={handleMoveLessonToSection}
                  onSaveLessonContent={handleSaveLessonContent}
                  onToggleExpandedLesson={(lessonId) => {
                    startTransition(() => {
                      setExpandedLessonId((current) => (current === lessonId ? null : lessonId));
                    });
                  }}
                  onToggleSection={handleToggleSection}
                  onUpdateLessonTitle={handleUpdateLessonTitle}
                  savingLessonId={savingLessonId}
                  section={section}
                  sectionCollapsed={collapsedSectionIds.has(section.id)}
                  sections={sections}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </DndContext>

      <Button onClick={() => void handleCreateSection()} size="sm" variant="outline">
        <PlusIcon className="size-4" />
        Add section
      </Button>
    </div>
  );
}
