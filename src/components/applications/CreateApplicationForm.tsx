"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createApplication } from "@/lib/applicationsApi";

export default function CreateApplicationForm() {
  const t = useTranslations("Applications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const allowedUrl = String(formData.get("allowedUrl") ?? "").trim();

    if (!name || !allowedUrl) {
      setError(t("createError"));
      return;
    }

    const created = await createApplication({
      name,
      allowedUrls: [allowedUrl],
    });

    if (!created) {
      setError(t("createError"));
      return;
    }

    form.reset();
    startTransition(() => router.refresh());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 items-start"
    >
      <input
        name="name"
        type="text"
        placeholder={t("createNamePlaceholder")}
        required
        className="flex-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
      <input
        name="allowedUrl"
        type="url"
        placeholder={t("createUrlPlaceholder")}
        required
        className="flex-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 whitespace-nowrap"
      >
        {t("createSubmit")}
      </button>
      {error && <p className="text-sm text-error">{error}</p>}
    </form>
  );
}
