"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, removeToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  async function handleLogout() {
    await apiFetch("/logout", { method: "POST" });
    removeToken();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <button
        onClick={handleLogout}
        className="rounded-full bg-black px-5 py-2 text-white transition-colors hover:bg-zinc-700"
      >
        Se déconnecter
      </button>
    </div>
  );
}
