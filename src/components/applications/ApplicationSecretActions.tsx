"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  generateApplicationSecret,
  revokeApplicationSecret,
} from "@/lib/applicationsApi";

interface Props {
  applicationId: number;
  hasSecret: boolean;
}

export default function ApplicationSecretActions({
  applicationId,
  hasSecret,
}: Props) {
  const t = useTranslations("Applications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);

  async function handleGenerate() {
    setError(null);
    const data = await generateApplicationSecret(applicationId);
    if (!data) {
      setError(t("secretError"));
      return;
    }
    setRevealedSecret(data.appSecret);
    setConfirmingRevoke(false);
    startTransition(() => router.refresh());
  }

  async function handleRevoke() {
    setError(null);
    const { ok } = await revokeApplicationSecret(applicationId);
    if (!ok) {
      setError(t("secretError"));
      return;
    }
    setConfirmingRevoke(false);
    setRevealedSecret(null);
    startTransition(() => router.refresh());
  }

  async function copyToClipboard() {
    if (!revealedSecret) return;
    try {
      await navigator.clipboard.writeText(revealedSecret);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  return (
    <div className="space-y-3">
      {revealedSecret && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3 space-y-2">
          <p className="text-xs font-medium text-warning">
            {t("secretRevealWarning")}
          </p>
          <code className="block break-all rounded bg-surface-2 px-2 py-1.5 text-xs font-mono">
            {revealedSecret}
          </code>
          <div className="flex gap-2 items-center">
            <button
              onClick={copyToClipboard}
              className="rounded px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20"
            >
              {t("copy")}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {hasSecret ? t("regenerate") : t("generate")}
        </button>

        {hasSecret && !confirmingRevoke && (
          <button
            onClick={() => setConfirmingRevoke(true)}
            disabled={isPending}
            className="rounded px-3 py-1 text-xs font-medium bg-error/10 text-error hover:bg-error/20 disabled:opacity-50"
          >
            {t("revoke")}
          </button>
        )}

        {confirmingRevoke && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-foreground-muted">
              {t("revokeConfirm")}
            </span>
            <button
              onClick={handleRevoke}
              disabled={isPending}
              className="rounded px-3 py-1 text-xs font-medium bg-error text-white hover:bg-error/90 disabled:opacity-50"
            >
              {t("revokeConfirmYes")}
            </button>
            <button
              onClick={() => setConfirmingRevoke(false)}
              disabled={isPending}
              className="rounded px-3 py-1 text-xs font-medium text-foreground-secondary hover:bg-surface-2"
            >
              {t("cancel")}
            </button>
          </div>
        )}

        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    </div>
  );
}
