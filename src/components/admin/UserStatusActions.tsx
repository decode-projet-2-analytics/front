"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateUserStatus, type UserStatus } from "@/lib/adminApi";
import { useTranslations } from "next-intl";

interface Props {
  userId: number;
  currentStatus: UserStatus;
  role: "Admin" | "Webmaster";
}

export default function UserStatusActions({ userId, currentStatus, role }: Props) {
  const t = useTranslations("Admin.users");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (role === "Admin") {
    return <span className="text-xs text-muted">—</span>;
  }

  async function handleStatus(status: UserStatus) {
    setError(null);
    const { ok } = await updateUserStatus(userId, status);
    if (!ok) {
      setError(t("updateError"));
      return;
    }
    startTransition(() => router.refresh());
  }

  if (currentStatus === "validated") {
    return (
      <button
        onClick={() => handleStatus("rejected")}
        disabled={isPending}
        className="rounded px-3 py-1 text-xs font-medium bg-error/10 text-error hover:bg-error/20 disabled:opacity-50"
      >
        {t("reject")}
      </button>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <div className="flex gap-2 items-center">
        <button
          onClick={() => handleStatus("validated")}
          disabled={isPending}
          className="rounded px-3 py-1 text-xs font-medium bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
        >
          {t("validate")}
        </button>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => handleStatus("validated")}
        disabled={isPending}
        className="rounded px-3 py-1 text-xs font-medium bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
      >
        {t("validate")}
      </button>
      <button
        onClick={() => handleStatus("rejected")}
        disabled={isPending}
        className="rounded px-3 py-1 text-xs font-medium bg-error/10 text-error hover:bg-error/20 disabled:opacity-50"
      >
        {t("reject")}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
