"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateApplication, type Application } from "@/lib/applicationsApi";

interface Props {
  application: Application;
}

export default function ApplicationSettingsForm({ application }: Props) {
  const t = useTranslations("Applications.detail.general");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const urlsRaw = String(formData.get("allowedUrls") ?? "");
    const allowedUrls = urlsRaw
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    if (!name) {
      setError(t("error"));
      return;
    }

    const updated = await updateApplication(application.id, {
      name,
      allowedUrls,
    });

    if (!updated) {
      setError(t("error"));
      return;
    }

    setSaved(true);
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="app-name"
          className="block text-sm font-medium text-foreground-muted mb-1"
        >
          {t("nameLabel")}
        </label>
        <input
          id="app-name"
          name="name"
          type="text"
          defaultValue={application.name}
          required
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="app-urls"
          className="block text-sm font-medium text-foreground-muted mb-1"
        >
          {t("urlsLabel")}
        </label>
        <textarea
          id="app-urls"
          name="allowedUrls"
          rows={4}
          defaultValue={application.allowedUrls.join("\n")}
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-mono"
        />
        <p className="mt-1 text-xs text-foreground-muted">{t("urlsHint")}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {t("save")}
        </button>
        {saved && <span className="text-xs text-success">{t("saved")}</span>}
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    </form>
  );
}
