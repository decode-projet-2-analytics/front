"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Application } from "@/lib/applicationsApi";
import type { Tag } from "@/lib/tagsApi";
import { API_BASE_URL } from "@/lib/env";
import { buildIntegrationSnippets } from "./integrationSnippets";

interface Props {
  application: Application;
  tags: Tag[];
}

interface CodeBlockProps {
  title: string;
  value: string;
  copyKey: string;
  copied: string | null;
  copyLabel: string;
  copiedLabel: string;
  onCopy: (value: string, key: string) => void;
}

function CodeBlock({
  title,
  value,
  copyKey,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <h4 className="text-xs font-medium text-foreground-secondary">{title}</h4>
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          className="shrink-0 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
        >
          {copied === copyKey ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function StepTitle({ number, children }: { number: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {number}
      </span>
      <h3 className="text-base font-semibold">{children}</h3>
    </div>
  );
}

export default function IntegrationPanel({ application, tags }: Props) {
  const t = useTranslations("Applications.detail.integration");
  const tApp = useTranslations("Applications");
  const [copied, setCopied] = useState<string | null>(null);

  const exampleTag = tags[0]?.slug ?? "purchase_confirmed";
  const snippets = buildIntegrationSnippets({
    appId: application.appId,
    apiBaseUrl: API_BASE_URL,
    tagSlug: exampleTag,
  });

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard access can be denied by the browser.
    }
  }

  const codeBlockLabels = {
    copied,
    copyLabel: tApp("copy"),
    copiedLabel: tApp("copied"),
    onCopy: copy,
  };

  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-2">
        <p className="text-sm text-foreground-secondary">{t("intro")}</p>
        <p className="text-sm text-foreground-muted">{t("introHelp")}</p>
      </div>

      <section className="space-y-5 rounded-xl border border-border p-5">
        <StepTitle number={1}>{t("prerequisitesTitle")}</StepTitle>
        <p className="text-sm text-foreground-secondary">
          {t("prerequisitesDescription")}
        </p>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t("appIdTitle")}</h4>
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
            <p className="text-xs text-foreground-muted">{t("appIdHelp")}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t("allowedUrlsTitle")}</h4>
            {application.allowedUrls.length === 0 ? (
              <p className="text-sm text-warning">
                {t("noAllowedUrls")} {" "}
                <Link
                  href={`/applications/${application.id}/general`}
                  className="font-medium text-primary hover:underline"
                >
                  {t("configureApplication")}
                </Link>
              </p>
            ) : (
              <ul className="space-y-1">
                {application.allowedUrls.map((url) => (
                  <li key={url} className="text-sm font-mono text-foreground-secondary">
                    {url}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-foreground-muted">{t("allowedUrlsHelp")}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <h4 className="text-sm font-medium">{t("availableTags")}</h4>
          {tags.length === 0 ? (
            <p className="text-sm text-warning">
              {t("noTags")} {" "}
              <Link
                href={`/applications/${application.id}/tags`}
                className="font-medium text-primary hover:underline"
              >
                {t("createTagsLink")}
              </Link>
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm"
                >
                  <code className="text-xs font-mono">{tag.slug}</code>
                  {tag.comment && (
                    <span className="text-xs text-foreground-muted">{tag.comment}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => copy(tag.slug, `tag-${tag.slug}`)}
                    className="rounded px-1.5 py-0.5 text-xs text-primary hover:bg-primary/10"
                  >
                    {copied === `tag-${tag.slug}` ? tApp("copied") : tApp("copy")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-foreground-muted">{t("tagsHelp")}</p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <StepTitle number={2}>{t("installTitle")}</StepTitle>
        <p className="text-sm text-foreground-secondary">{t("installDescription")}</p>
        <CodeBlock
          title={t("installCommandTitle")}
          value={snippets.install}
          copyKey="install"
          {...codeBlockLabels}
        />
      </section>

      <section className="space-y-5 rounded-xl border border-border p-5">
        <StepTitle number={3}>{t("browserTitle")}</StepTitle>
        <p className="text-sm text-foreground-secondary">{t("browserDescription")}</p>
        <CodeBlock
          title={t("browserEnvTitle")}
          value={snippets.browserEnv}
          copyKey="browser-env"
          {...codeBlockLabels}
        />
        <CodeBlock
          title={t("browserCodeTitle")}
          value={snippets.browserCode}
          copyKey="browser-code"
          {...codeBlockLabels}
        />
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p className="rounded-lg bg-primary/5 p-3 text-foreground-secondary">
            {t("browserAutomatic")}
          </p>
          <p className="rounded-lg bg-warning/5 p-3 text-foreground-secondary">
            {t("browserCorsNote")}
          </p>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-border p-5">
        <StepTitle number={4}>{t("serverTitle")}</StepTitle>
        <p className="text-sm text-foreground-secondary">{t("serverDescription")}</p>
        <CodeBlock
          title={t("serverEnvTitle")}
          value={snippets.serverEnv}
          copyKey="server-env"
          {...codeBlockLabels}
        />
        <CodeBlock
          title={t("serverCodeTitle")}
          value={snippets.serverCode}
          copyKey="server-code"
          {...codeBlockLabels}
        />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("serverFieldsTitle")}</h4>
          <dl className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="font-mono text-xs font-semibold">type</dt>
              <dd className="mt-1 text-foreground-secondary">{t("typeHelp")}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="font-mono text-xs font-semibold">tagSlug</dt>
              <dd className="mt-1 text-foreground-secondary">{t("tagSlugHelp")}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="font-mono text-xs font-semibold">sessionId</dt>
              <dd className="mt-1 text-foreground-secondary">{t("sessionIdHelp")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <aside className="space-y-3 rounded-xl border border-warning/30 bg-warning/5 p-5">
        <h3 className="font-semibold text-warning">{t("securityTitle")}</h3>
        <p className="text-sm text-foreground-secondary">{t("securityDescription")}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-secondary">
          <li>{t("securityPublicId")}</li>
          <li>{t("securitySecret")}</li>
          <li>{t("securityNoPublicPrefix")}</li>
        </ul>
        <Link
          href={`/applications/${application.id}/general`}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          {t("manageCredentials")}
        </Link>
      </aside>

      <Link
        href="/dashboard"
        className="inline-flex rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
      >
        {t("openDashboard")}
      </Link>
    </div>
  );
}
