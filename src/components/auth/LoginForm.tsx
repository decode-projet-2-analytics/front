"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { loginAction } from "@/lib/session";

interface Props {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = "/dashboard" }: Props) {
  const t = useTranslations("Auth.login");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? ""),
      redirectTo,
    );

    if (!result.ok) {
      if (result.error === "pending") {
        startTransition(() => {
          router.replace("/pending");
          router.refresh();
        });
        return;
      }
      setError(
        result.error === "rejected" ? t("errorRejected") : t("error"),
      );
      return;
    }

    startTransition(() => {
      router.replace(result.redirectTo);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="email"
        type="email"
        placeholder={t("email")}
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
      <input
        name="password"
        type="password"
        placeholder={t("password")}
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        {t("submit")}
      </button>
    </form>
  );
}
