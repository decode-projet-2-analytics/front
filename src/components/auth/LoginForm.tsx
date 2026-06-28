"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { setToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await apiFetch(`/login`, {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (!response.ok) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    const data: { token: string } = await response.json();
    setToken(data.token);
    router.replace("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
      <input
        name="password"
        type="password"
        placeholder="Mot de passe"
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Se connecter
      </button>
    </form>
  );
}
