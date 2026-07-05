"use client";

import { useTranslations } from "next-intl";
import type { Application } from "@/lib/applicationsApi";

interface Props {
    applications: Application[];
    value: number | null;
    onChange: (applicationId: number) => void;
}

export default function ApplicationSelector({
    applications,
    value,
    onChange,
}: Props) {
    const t = useTranslations("Dashboard");

    if (applications.length === 0) {
        return (
        <p className="text-sm text-foreground-muted">{t("noApplications")}</p>
        );
    }

    return (
        <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground-muted">
            {t("applicationLabel")}
        </span>
        <select
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0"
        >
            {applications.map((app) => (
            <option key={app.id} value={app.id}>
                {app.name}
            </option>
            ))}
        </select>
        </label>
    );
}
