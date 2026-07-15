"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  archiveTag,
  createTag,
  updateTag,
  type Tag,
} from "@/lib/tagsApi";

interface Props {
  applicationId: number;
  tags: Tag[];
  canManage: boolean;
}

export default function TagTable({ applicationId, tags, canManage }: Props) {
  const t = useTranslations("Applications.detail.tags");
  const tApp = useTranslations("Applications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftComment, setDraftComment] = useState("");
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const slug = String(formData.get("slug") ?? "").trim();
    const comment = String(formData.get("comment") ?? "").trim();
    if (!slug) {
      setCreateError(t("createError"));
      return;
    }
    const created = await createTag({ slug, comment, applicationId });
    if (!created) {
      setCreateError(t("createError"));
      return;
    }
    form.reset();
    refresh();
  }

  async function handleSave(id: number) {
    setError(null);
    const updated = await updateTag(id, { comment: draftComment.trim() });
    if (!updated) {
      setError(t("updateError"));
      return;
    }
    setEditingId(null);
    refresh();
  }

  async function handleArchive(id: number) {
    setError(null);
    const { ok } = await archiveTag(id);
    if (!ok) {
      setError(t("archiveError"));
      return;
    }
    setConfirmArchiveId(null);
    refresh();
  }

  async function copySlug(slug: string) {
    try {
      await navigator.clipboard.writeText(slug);
      setCopied(slug);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {tags.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">{t("colSlug")}</th>
                <th className="px-4 py-2 font-medium">{t("colComment")}</th>
                <th className="px-4 py-2 font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-t border-border">
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs break-all">
                        {tag.slug}
                      </code>
                      <button
                        type="button"
                        onClick={() => copySlug(tag.slug)}
                        className="shrink-0 rounded px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
                      >
                        {copied === tag.slug ? tApp("copied") : tApp("copy")}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {editingId === tag.id ? (
                      <input
                        value={draftComment}
                        onChange={(e) => setDraftComment(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-foreground-secondary">
                        {tag.comment || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {canManage && <div className="flex flex-wrap gap-2 items-center">
                      {editingId === tag.id ? (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSave(tag.id)}
                            className="rounded px-2 py-1 text-xs font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                          >
                            {t("save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded px-2 py-1 text-xs text-foreground-secondary hover:bg-surface-2"
                          >
                            {t("cancel")}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(tag.id);
                            setDraftComment(tag.comment);
                            setConfirmArchiveId(null);
                          }}
                          className="rounded px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          {t("edit")}
                        </button>
                      )}

                      {confirmArchiveId === tag.id ? (
                        <>
                          <span className="text-xs text-foreground-muted">
                            {t("archiveConfirm")}
                          </span>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleArchive(tag.id)}
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
                            setConfirmArchiveId(tag.id);
                            setEditingId(null);
                          }}
                          className="rounded px-2 py-1 text-xs font-medium bg-error/10 text-error hover:bg-error/20"
                        >
                          {t("archive")}
                        </button>
                      )}
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      {canManage && <form
        onSubmit={handleCreate}
        className="rounded-lg border border-dashed border-border bg-surface-0 p-4 flex flex-col sm:flex-row gap-3 items-start"
      >
        <input
          name="slug"
          type="text"
          placeholder={t("createSlugPlaceholder")}
          required
          className="flex-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-mono"
        />
        <input
          name="comment"
          type="text"
          placeholder={t("createCommentPlaceholder")}
          className="flex-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 whitespace-nowrap"
        >
          {t("createSubmit")}
        </button>
        {createError && (
          <p className="text-sm text-error sm:w-full">{createError}</p>
        )}
      </form>}
    </div>
  );
}
