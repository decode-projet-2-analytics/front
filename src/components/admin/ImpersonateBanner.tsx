"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { stopImpersonating } from "@/lib/auth";

interface Props {
  email: string;
}

export default function ImpersonateBanner({ email }: Props) {
  const t = useTranslations("Admin.impersonate");
  const router = useRouter();

  function handleStop() {
    stopImpersonating();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-warning px-6 py-2 text-sm font-medium text-warning-foreground">
      <span>{t("banner", { email })}</span>
      <button
        onClick={handleStop}
        className="rounded border border-warning-foreground/30 px-3 py-0.5 text-xs hover:cursor-pointer hover:bg-warning-foreground/10 transition-colors"
      >
        {t("stop")}
      </button>
    </div>
  );
}
