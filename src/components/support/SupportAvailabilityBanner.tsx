"use client";

import { useTranslations } from "next-intl";
import { useNotificationsContext } from "@/context/NotificationsProvider";
import { usePeerAvailability } from "@/hooks/usePeerAvailability";

export default function SupportAvailabilityBanner() {
  const t = useTranslations("Support");
  const { userRole } = useNotificationsContext();
  const supportAvailable = usePeerAvailability(null);

  if (userRole !== "Webmaster") {
    return null;
  }

  return (
    <div
      className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
        supportAvailable
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-surface-1 text-foreground-muted"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          supportAvailable ? "bg-success" : "bg-foreground-muted"
        }`}
      />
      {supportAvailable ? t("supportAvailable") : t("supportUnavailable")}
    </div>
  );
}
