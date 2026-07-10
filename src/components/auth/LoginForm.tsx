"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setToken, setRefreshToken, clearSession } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/env";

export default function LoginForm() {
  const t = useTranslations("Auth.login");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (response.status === 403) {
      const body = await response.json().catch(() => ({}));
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

    const data: {
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    } = await response.json();
    const accessToken = data.accessToken ?? data.token;
    if (!accessToken) {
      setError(t("error"));
      return;
    }

    setToken(accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);

    try {
      const payload = JSON.parse(
        atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      const sub = payload.sub;
      const meRes = await fetch(`${API_BASE_URL}/users/${sub}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
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
      router.replace("/dashboard");
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
