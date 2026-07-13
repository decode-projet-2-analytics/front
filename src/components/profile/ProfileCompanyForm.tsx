"use client";

import { ChangeEvent, FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API_BASE_URL } from "@/lib/env";
import { updateMe, type CurrentUser } from "@/lib/userApi";

interface Props {
  user: CurrentUser;
}

const inputClassName =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm";

function isValidWebsiteUrl(url: string) {
  return /^https?:\/\/.+/.test(url);
}

export default function ProfileCompanyForm({ user }: Props) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleKbisChange(event: ChangeEvent<HTMLInputElement>) {
    setKbisFile(event.target.files?.[0] ?? null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const companyName =
      String(formData.get("companyName") ?? "").trim() || null;
    const websiteRaw = String(formData.get("websiteUrl") ?? "").trim();

    let websiteUrl: string | null = null;
    if (websiteRaw) {
      if (!isValidWebsiteUrl(websiteRaw)) {
        setError(t("invalidWebsite"));
        return;
      }
      websiteUrl = websiteRaw;
    }

    if (kbisFile && kbisFile.type !== "application/pdf") {
      setError(t("errorKbis"));
      return;
    }

    let kbisDocument: string | undefined;
    if (kbisFile) {
      try {
        const uploadData = new FormData();
        uploadData.append("kbis", kbisFile);

        const uploadResponse = await fetch(`${API_BASE_URL}/auth/kbis`, {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResponse.ok) {
          setError(t("errorKbis"));
          return;
        }

        const data = (await uploadResponse.json()) as { kbisDocument: string };
        kbisDocument = data.kbisDocument;
      } catch {
        setError(t("errorKbis"));
        return;
      }
    }

    const updated = await updateMe({
      companyName,
      websiteUrl,
      ...(kbisDocument !== undefined ? { kbisDocument } : {}),
    });

    if (!updated) {
      setError(t("error"));
      return;
    }

    setKbisFile(null);
    setSaved(true);
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="profile-company"
          className="block text-sm font-medium text-foreground-muted mb-1"
        >
          {t("company")}
        </label>
        <input
          id="profile-company"
          name="companyName"
          type="text"
          defaultValue={user.companyName ?? ""}
          autoComplete="organization"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="profile-website"
          className="block text-sm font-medium text-foreground-muted mb-1"
        >
          {t("website")}
        </label>
        <input
          id="profile-website"
          name="websiteUrl"
          type="url"
          defaultValue={user.websiteUrl ?? ""}
          placeholder={t("websitePlaceholder")}
          autoComplete="url"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="profile-kbis"
          className="block text-sm font-medium text-foreground-muted mb-1"
        >
          {t("kbis")}
        </label>
        <input
          key="kbis-upload"
          id="profile-kbis"
          name="kbis"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleKbisChange}
          className={`${inputClassName} file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-white`}
        />
        <p className="mt-1 text-xs text-foreground-muted">{t("kbisHint")}</p>
        {kbisFile ? (
          <p className="mt-1 text-xs text-foreground-secondary">
            {t("kbisSelected", { name: kbisFile.name })}
          </p>
        ) : user.kbisDocument ? (
          <p className="mt-1 text-xs text-foreground-secondary">
            {t("kbisOnFile")}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? t("saving") : t("save")}
        </button>
        {saved && <span className="text-xs text-success">{t("saved")}</span>}
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    </form>
  );
}
