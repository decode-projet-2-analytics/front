"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setToken, setRefreshToken, clearSession } from "@/lib/auth";
import { apiFetchClient } from "@/lib/api";
import { fetchMe } from "@/lib/userApi";

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

    const response = await apiFetchClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (response.status === 403) {
      const body = response.body as { error?: { message?: string } };
      const message: string = body?.error?.message ?? "";
      if (message.toLowerCase().includes("attente")) {
        router.replace("/pending");
      } else {
        setError(t("errorRejected"));
      }
      return;
    }

    if (!response.ok) {
      setError(t("error"));
      return;
    }

    const data = response.body as {
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    };
    const accessToken = data.accessToken ?? data.token;
    if (!accessToken) {
      setError(t("error"));
      return;
    }

    setToken(accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);

    try {
      const me = await fetchMe();
      if (me) {
        if (me.status === "pending") {
          startTransition(() => {
            router.replace("/pending");
            router.refresh();
          });
          return;
        }
        if (me.status === "rejected") {
          setError(t("errorRejected"));
          clearSession();
          return;
        }
      }
    } catch {}

    startTransition(() => {
      router.replace(redirectTo);
      router.refresh();
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
