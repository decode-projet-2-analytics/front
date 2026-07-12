import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import { fetchApplications } from "@/lib/applicationsApi";
import { getDefaultApplicationId } from "@/lib/env";
import DashboardView from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  const [t, me, applications] = await Promise.all([
    getTranslations("Dashboard"),
    fetchMe(),
    fetchApplications(),
  ]);

  const displayName =
    [me?.firstname, me?.lastname].filter(Boolean).join(" ") ||
    me?.email ||
    "-";

  const defaultApplicationId =
    applications.find((app) => app.id === getDefaultApplicationId())?.id ??
    applications[0]?.id ??
    null;

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-6xl mx-auto w-full gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t("greeting", { name: displayName })}
          </h1>
          {me?.companyName && (
            <p className="text-sm text-foreground-secondary mt-1">
              {me.companyName}
            </p>
          )}
        </div>
        <Link
          href="/profile"
          className="shrink-0 text-sm text-foreground-secondary transition-colors hover:text-foreground"
        >
          {t("editProfile")}
        </Link>
      </div>

      <DashboardView
        applications={applications}
        defaultApplicationId={defaultApplicationId}
      />
    </div>
  );
}
