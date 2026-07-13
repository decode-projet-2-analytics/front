"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Application } from "@/lib/applicationsApi";
import type { Tag } from "@/lib/tagsApi";

interface Props {
  application: Application;
  tags: Tag[];
}

export default function IntegrationPanel({ application, tags }: Props) {
  const t = useTranslations("Applications.detail.integration");
  const tApp = useTranslations("Applications");
  const [copied, setCopied] = useState<string | null>(null);

  const exampleTag = tags[0]?.slug ?? "buy_confirmed";

  const snippet = `import { init, track } from "@analytics/sdk-browser";

// Decode Analytics SDK
const APP_ID = "${application.appId}";
const TAG_SLUG = "${exampleTag}";

init({
  appId: APP_ID,
  endpoint: "https://your-api.example.com/api/v1/collect",
});

track(TAG_SLUG, {
  metadata: { source: "integration-panel" },
});`;

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground-secondary">{t("intro")}</p>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{t("appIdTitle")}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="rounded bg-surface-2 px-2 py-1.5 text-xs font-mono break-all">
            {application.appId}
          </code>
          <button
            type="button"
            onClick={() => copy(application.appId, "appId")}
            className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            {copied === "appId" ? tApp("copied") : tApp("copy")}
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{t("allowedUrlsTitle")}</h3>
        {application.allowedUrls.length === 0 ? (
          <p className="text-sm text-foreground-muted">—</p>
        ) : (
          <ul className="space-y-1">
            {application.allowedUrls.map((url) => (
              <li key={url} className="text-sm font-mono text-foreground-secondary">
                {url}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{t("availableTags")}</h3>
        {tags.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            {t("noTags")}{" "}
            <Link
              href={`/applications/${application.id}/tags`}
              className="text-primary hover:underline"
            >
              {t("createTagsLink")}
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center gap-2 flex-wrap text-sm"
              >
                <code className="rounded bg-surface-2 px-2 py-0.5 text-xs font-mono">
                  {tag.slug}
                </code>
                {tag.comment && (
                  <span className="text-foreground-muted">{tag.comment}</span>
                )}
                <button
                  type="button"
                  onClick={() => copy(tag.slug, tag.slug)}
                  className="rounded px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
                >
                  {copied === tag.slug ? tApp("copied") : tApp("copy")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{t("snippetTitle")}</h3>
          <button
            type="button"
            onClick={() => copy(snippet, "snippet")}
            className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            {copied === "snippet" ? tApp("copied") : tApp("copy")}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 text-xs font-mono leading-relaxed">
          {snippet}
        </pre>
      </section>

      <Link
        href="/dashboard"
        className="inline-flex rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
      >
        {t("openDashboard")}
      </Link>
    </div>
  );
}
