"use client";

import { useDroppable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

interface Props {
  id: string;
  enabled: boolean;
}

export default function RowDropZone({ id, enabled }: Props) {
  const t = useTranslations("Dashboard");
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !enabled });

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      aria-label={t("dropRowGap")}
      className={`flex w-full shrink-0 items-center ${
        isOver ? "py-1" : "h-8"
      }`}
    >
      {isOver ? (
        <div className="h-10 w-full rounded-md border-2 border-primary bg-primary/15 transition-all duration-150" />
      ) : null}
    </div>
  );
}
