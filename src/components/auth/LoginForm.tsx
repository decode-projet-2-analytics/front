"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setToken, removeToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default function LoginForm() {
  const t = useTranslations("Auth.login");
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await apiFetch(`/auth/login`, {
      method: "POST",
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

    const data: { token: string } = await response.json();
    setToken(data.token);

    try {
      const payload = JSON.parse(
        atob(data.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const sub = payload.sub;
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      const meRes = await fetch(`${BASE_URL}/users/${sub}`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.status === "pending") {
          router.replace("/pending");
          return;
        }
        if (me.status === "rejected") {
          setError(t("errorRejected"));
          removeToken();
          return;
        }
      }
    } catch {
    }

    router.replace("/dashboard");
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
