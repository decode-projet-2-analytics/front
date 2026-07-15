import {
  fetchApplicationRole,
  fetchApplications,
  type ApplicationTeamRole,
} from "@/lib/applicationsApi";
import { getDefaultApplicationId } from "@/lib/env";
import DashboardView from "@/components/dashboard/DashboardView";
import { getServerRole } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

interface Props {
  searchParams: Promise<{ applicationId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const [globalRole, locale, applications, params] = await Promise.all([
    getServerRole(),
    getLocale(),
    fetchApplications(),
    searchParams,
  ]);

  if (globalRole === "Admin") {
    redirect({ href: "/applications", locale });
  }

  const requestedId = Number(params.applicationId);
  const defaultApplicationId =
    applications.find((app) => app.id === requestedId)?.id ??
    applications.find((app) => app.id === getDefaultApplicationId())?.id ??
    applications[0]?.id ??
    null;

  const applicationRoles = await Promise.all(
    applications.map(async (application) => ({
      id: application.id,
      role: await fetchApplicationRole(application.id),
    })),
  );
  const roleByApplication = Object.fromEntries(
    applicationRoles.map(({ id, role }) => [id, role]),
  ) as Record<number, ApplicationTeamRole | null>;

  return (
    <div className="flex w-full flex-1 flex-col">
      <DashboardView
        applications={applications}
        defaultApplicationId={defaultApplicationId}
        roleByApplication={roleByApplication}
      />
    </div>
  );
}
