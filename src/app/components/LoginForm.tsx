"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      }
    );

    if (!response.ok) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    const data: { token: string } = await response.json();

    setToken(data.token);
    router.replace("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Mot de passe"
        required
      />

      {error && <p>{error}</p>}

      <button type="submit">Se connecter</button>
    </form>
  );
}