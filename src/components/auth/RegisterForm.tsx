"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await apiFetch(`/users`, {
      method: "POST",
      body: JSON.stringify({
        firstname: formData.get("firstname"),
        lastname: formData.get("lastname"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (!response.ok) {
      setError("Une erreur est survenue, veuillez réessayer.");
      return;
    }

    router.replace("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="firstname"
        type="text"
        placeholder="Prénom"
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
      <input
        name="lastname"
        type="text"
        placeholder="Nom"
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
      />
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
        S&apos;inscrire
      </button>
    </form>
  );
}
