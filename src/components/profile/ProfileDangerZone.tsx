"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { clearSession } from "@/lib/auth";
import { deleteMe } from "@/lib/userApi";

export default function ProfileDangerZone() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    const ok = await deleteMe();
    if (!ok) {
      setError(t("deleteError"));
      return;
    }

    clearSession();
    startTransition(() => {
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground-secondary">{t("dangerHint")}</p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isPending}
          className="rounded-md bg-error/10 px-4 py-2 text-sm font-medium text-error hover:bg-error/20 disabled:opacity-50"
        >
          {t("deleteAccount")}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground-muted">
            {t("deleteConfirm")}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md bg-error px-3 py-1.5 text-xs font-medium text-white hover:bg-error/90 disabled:opacity-50"
          >
            {t("deleteConfirmYes")}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:bg-surface-2"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
