"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { clearSession } from "@/lib/auth";
import { updateMe } from "@/lib/userApi";

export default function ProfileSecurityPanel() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }

    const updated = await updateMe({ password });
    if (!updated) {
      setError(t("error"));
      return;
    }

    form.reset();
    setSaved(true);
    startTransition(() => router.refresh());
  }

  function handleLogout() {
    clearSession();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <p className="text-sm text-foreground-secondary">{t("passwordHint")}</p>

        <div>
          <label
            htmlFor="profile-password"
            className="block text-sm font-medium text-foreground-muted mb-1"
          >
            {t("newPassword")}
          </label>
          <input
            id="profile-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="profile-password-confirm"
            className="block text-sm font-medium text-foreground-muted mb-1"
          >
            {t("confirmPassword")}
          </label>
          <input
            id="profile-password-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {isPending ? t("saving") : t("changePassword")}
          </button>
          {saved && <span className="text-xs text-success">{t("saved")}</span>}
          {error && <span className="text-xs text-error">{error}</span>}
        </div>
      </form>

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-sm text-foreground-secondary">{t("sessionHint")}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-surface-0 hover:text-foreground"
        >
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
