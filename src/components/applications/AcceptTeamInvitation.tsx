"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { acceptTeamInvitation } from "@/lib/applicationsApi";

interface Props {
  token: string;
  authenticated: boolean;
}

export default function AcceptTeamInvitation({ token, authenticated }: Props) {
  const t = useTranslations("Applications.team.accept");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const submitStartedRef = useRef(false);
  const invitationPath = `/team-invitations/${token}`;

  const handleAccept = useCallback(async () => {
    if (submitStartedRef.current) return;
    submitStartedRef.current = true;
    setHasSubmitted(true);
    setError("");
    const result = await acceptTeamInvitation(token);
    if (!result.ok) {
      submitStartedRef.current = false;
      setHasSubmitted(false);
      setError(result.message ?? t("error"));
      return;
    }
    startTransition(() => router.push("/applications"));
  }, [router, startTransition, t, token]);

  useEffect(() => {
    if (authenticated) {
      const timer = window.setTimeout(() => {
        void handleAccept();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [authenticated, handleAccept]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-border bg-surface-1 p-6">
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm text-foreground-secondary">
            {t("subtitle")}
          </p>
        </div>
        {authenticated ? (
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending || hasSubmitted}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {hasSubmitted ? t("loading") : t("submit")}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-foreground-secondary">
              {t("authRequired")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={`/login?redirect=${encodeURIComponent(invitationPath)}`}
                className="rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-hover"
              >
                {t("login")}
              </Link>
              <Link
                href={`/register?invitation=${encodeURIComponent(token)}`}
                className="rounded-md border border-border px-4 py-2 text-center text-sm font-medium hover:bg-surface-2"
              >
                {t("register")}
              </Link>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    </div>
  );
}
