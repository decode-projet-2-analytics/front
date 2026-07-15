"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Tag } from "@/lib/tagsApi";
import {
  archiveTunnel,
  createTunnel,
  updateTunnel,
  type Tunnel,
} from "@/lib/tunnelsApi";
import TunnelStepEditor from "./TunnelStepEditor";

interface Props {
  applicationId: number;
  tunnels: Tunnel[];
  tags: Tag[];
  canManage: boolean;
}

export default function TunnelList({ applicationId, tunnels, tags, canManage }: Props) {
  const t = useTranslations("Applications.detail.tunnels");
  const tApp = useTranslations("Applications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);
  const [stepIds, setStepIds] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftSteps, setDraftSteps] = useState<Record<number, number[]>>({});

  useEffect(() => {
    setDraftSteps({});
  }, [tunnels]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function stepsFor(tunnel: Tunnel) {
    return draftSteps[tunnel.id] ?? tunnel.tagIds;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) {
      setCreateError(t("createError"));
      return;
    }
    const created = await createTunnel({
      name,
      applicationId,
      tagIds: stepIds,
    });
    if (!created) {
      setCreateError(t("createError"));
      return;
    }
    form.reset();
    setStepIds([]);
    refresh();
  }

  async function handleSaveName(tunnelId: number) {
    setError(null);
    const name = draftName.trim();
    if (!name) {
      setError(t("updateError"));
      return;
    }
    const updated = await updateTunnel(tunnelId, { name });
    if (!updated) {
      setError(t("updateError"));
      return;
    }
    setRenamingId(null);
    refresh();
  }

  async function persistSteps(tunnel: Tunnel, nextIds: number[]) {
    setError(null);
    setDraftSteps((prev) => ({ ...prev, [tunnel.id]: nextIds }));
    const updated = await updateTunnel(tunnel.id, { tagIds: nextIds });
    if (!updated) {
      setError(t("updateError"));
      setDraftSteps((prev) => {
        const copy = { ...prev };
        delete copy[tunnel.id];
        return copy;
      });
      return;
    }
    refresh();
  }

  async function handleArchive(tunnelId: number) {
    setError(null);
    const { ok } = await archiveTunnel(tunnelId);
    if (!ok) {
      setError(t("archiveError"));
      return;
    }
    setConfirmArchiveId(null);
    refresh();
  }

  async function copyTunnelId(tunnelId: string) {
    try {
      await navigator.clipboard.writeText(tunnelId);
      setCopiedId(tunnelId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {tunnels.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {tunnels.map((tunnel) => {
            const orderedIds = stepsFor(tunnel);
            const isRenaming = renamingId === tunnel.id;

            return (
              <div
                key={tunnel.id}
                className="rounded-lg border border-border bg-surface-1 p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1 space-y-2">
                    {canManage && isRenaming ? (
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="flex min-w-[14rem] flex-1 flex-col gap-1">
                          <span className="text-xs font-medium text-foreground-muted">
                            {t("nameLabel")}
                          </span>
                          <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveName(tunnel.id);
                              }
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-medium"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSaveName(tunnel.id)}
                          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                          {t("saveName")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingId(null)}
                          className="rounded-md px-3 py-2 text-xs text-foreground-secondary hover:bg-surface-2"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold truncate">
                          {tunnel.name}
                        </h3>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingId(tunnel.id);
                              setDraftName(tunnel.name);
                              setConfirmArchiveId(null);
                            }}
                            className="rounded px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
                          >
                            {t("rename")}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <span>{t("tunnelId")}</span>
                      <code className="font-mono break-all">{tunnel.tunnelId}</code>
                      <button
                        type="button"
                        onClick={() => copyTunnelId(tunnel.tunnelId)}
                        className="shrink-0 rounded px-2 py-0.5 text-primary hover:bg-primary/10"
                      >
                        {copiedId === tunnel.tunnelId
                          ? tApp("copied")
                          : tApp("copy")}
                      </button>
                    </div>
                  </div>

                  {canManage && <div className="flex flex-wrap gap-2 items-center">
                    {confirmArchiveId === tunnel.id ? (
                      <>
                        <span className="text-xs text-foreground-muted">
                          {t("archiveConfirm")}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleArchive(tunnel.id)}
                          className="rounded px-2 py-1 text-xs font-medium bg-error text-white hover:bg-error/90 disabled:opacity-50"
                        >
                          {t("archiveYes")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmArchiveId(null)}
                          className="rounded px-2 py-1 text-xs text-foreground-secondary hover:bg-surface-2"
                        >
                          {t("cancel")}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmArchiveId(tunnel.id);
                          setRenamingId(null);
                        }}
                        className="rounded px-2 py-1 text-xs font-medium bg-error/10 text-error hover:bg-error/20"
                      >
                        {t("archive")}
                      </button>
                    )}
                  </div>}
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium text-foreground-muted">
                    {t("steps")}
                  </p>
                  <TunnelStepEditor
                    tagIds={orderedIds}
                    tags={tags}
                    disabled={isPending || !canManage}
                    onChange={(nextIds) => persistSteps(tunnel, nextIds)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      {canManage && <form
        onSubmit={handleCreate}
        className="rounded-lg border border-dashed border-border bg-surface-0 p-4 space-y-4"
      >
        <h3 className="text-sm font-medium">{t("createTitle")}</h3>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground-muted">
            {t("nameLabel")}
          </span>
          <input
            name="name"
            type="text"
            placeholder={t("namePlaceholder")}
            required
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground-muted">
            {t("selectSteps")}
          </p>
          <TunnelStepEditor
            tagIds={stepIds}
            tags={tags}
            onChange={setStepIds}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {t("createSubmit")}
        </button>
        {createError && <p className="text-sm text-error">{createError}</p>}
      </form>}
    </div>
  );
}
