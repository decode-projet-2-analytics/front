"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Tag } from "@/lib/tagsApi";

interface StepRowProps {
  index: number;
  tag: Tag;
  disabled?: boolean;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

function StepRow({
  index,
  tag,
  disabled,
  onRemove,
  dragHandleProps,
  setNodeRef,
  style,
  isDragging,
}: StepRowProps) {
  const t = useTranslations("Applications.detail.tunnels");

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-md border border-border bg-surface-0 px-2 py-2 text-sm ${
        isDragging ? "z-10 opacity-90 shadow-md ring-1 ring-primary/40" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded px-1.5 py-1 text-foreground-muted hover:bg-surface-2 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled || !dragHandleProps}
        aria-label={t("dragHandle")}
        title={t("dragHandle")}
        {...dragHandleProps}
      >
        <span className="block leading-none tracking-tighter" aria-hidden>
          ⋮⋮
        </span>
      </button>

      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-medium text-foreground-muted">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs">{tag.slug}</p>
        {tag.comment ? (
          <p className="truncate text-xs text-foreground-muted">{tag.comment}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-error opacity-80 hover:bg-error/10 hover:opacity-100 disabled:opacity-40"
        title={t("removeStep")}
      >
        {t("removeStep")}
      </button>
    </li>
  );
}

function SortableStep({
  id,
  index,
  tag,
  disabled,
  onRemove,
}: {
  id: number;
  index: number;
  tag: Tag;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: disabled ?? false,
    resizeObserverConfig: undefined,
  });

  return (
    <StepRow
      index={index}
      tag={tag}
      disabled={disabled}
      onRemove={onRemove}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

interface Props {
  tagIds: number[];
  tags: Tag[];
  disabled?: boolean;
  onChange: (nextIds: number[]) => void;
}

export default function TunnelStepEditor({
  tagIds,
  tags,
  disabled,
  onChange,
}: Props) {
  const t = useTranslations("Applications.detail.tunnels");
  const [pickerOpen, setPickerOpen] = useState(false);
  // Avoid dnd-kit aria-describedby ID mismatch between SSR and client
  const [dndReady, setDndReady] = useState(false);

  useEffect(() => {
    setDndReady(true);
  }, []);

  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const availableTags = tags.filter((tag) => !tagIds.includes(tag.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tagIds.indexOf(Number(active.id));
    const newIndex = tagIds.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(arrayMove(tagIds, oldIndex, newIndex));
  }

  function addTag(tagId: number) {
    if (tagIds.includes(tagId)) return;
    onChange([...tagIds, tagId]);
    if (availableTags.length <= 1) setPickerOpen(false);
  }

  function removeAt(index: number) {
    onChange(tagIds.filter((_, i) => i !== index));
  }

  function renderSteps() {
    if (tagIds.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border bg-surface-0 px-3 py-4 text-center">
          <p className="text-xs text-foreground-muted">{t("noSteps")}</p>
          <p className="mt-1 text-xs text-foreground-muted">{t("addStepHint")}</p>
        </div>
      );
    }

    const list = (
      <ol className="space-y-2">
        {tagIds.map((id, index) => {
          const tag = tagById.get(id);
          if (!tag) return null;
          if (!dndReady) {
            return (
              <StepRow
                key={`${id}-${index}`}
                index={index}
                tag={tag}
                disabled={disabled}
                onRemove={() => removeAt(index)}
              />
            );
          }
          return (
            <SortableStep
              key={`${id}-${index}`}
              id={id}
              index={index}
              tag={tag}
              disabled={disabled}
              onRemove={() => removeAt(index)}
            />
          );
        })}
      </ol>
    );

    return (
      <>
        <p className="text-xs text-foreground-muted">{t("dragHint")}</p>
        {dndReady ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tagIds}
              strategy={verticalListSortingStrategy}
            >
              {list}
            </SortableContext>
          </DndContext>
        ) : (
          list
        )}
      </>
    );
  }

  return (
    <div className="space-y-3">
      {renderSteps()}

      {tags.length === 0 ? (
        <p className="text-xs text-foreground-muted">{t("noTagsForTunnel")}</p>
      ) : availableTags.length === 0 ? (
        <p className="text-xs text-foreground-muted">{t("allTagsAdded")}</p>
      ) : (
        <div className="space-y-2">
          {!pickerOpen ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-primary hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
            >
              <span aria-hidden>+</span>
              {t("addStep")}
            </button>
          ) : (
            <div className="rounded-md border border-border bg-surface-0 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground-muted">
                  {t("pickTag")}
                </p>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="rounded px-2 py-0.5 text-xs text-foreground-secondary hover:bg-surface-2"
                >
                  {t("cancel")}
                </button>
              </div>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {availableTags.map((tag) => (
                  <li key={tag.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => addTag(tag.id)}
                      className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-surface-2 disabled:opacity-50"
                    >
                      <span className="mt-0.5 text-primary text-sm leading-none">
                        +
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-xs">
                          {tag.slug}
                        </span>
                        {tag.comment ? (
                          <span className="block truncate text-xs text-foreground-muted">
                            {tag.comment}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
