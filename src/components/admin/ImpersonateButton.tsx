"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { startImpersonation } from "@/lib/adminApi";

interface Props {
  userId: number;
}

export default function ImpersonateButton({ userId }: Props) {
  const t = useTranslations("Admin.impersonate");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleImpersonate() {
    setError(null);
    const result = await startImpersonation(userId);
    if (!result.ok) {
      setError(t("error"));
      return;
    }
    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleImpersonate}
        disabled={isPending}
        className="rounded px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
      >
        {t("button")}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
