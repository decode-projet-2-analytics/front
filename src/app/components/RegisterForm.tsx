"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    <form onSubmit={handleSubmit}>
      <input
        name="firstname"
        type="text"
        placeholder="Prénom"
        required
      />
      <input
        name="lastname"
        type="text"
        placeholder="Nom"
        required
      />
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

      <button type="submit">S&apos;inscrire</button>
    </form>
  );
}
