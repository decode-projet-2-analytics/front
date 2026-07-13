import { fetchApplications } from "@/lib/applicationsApi";
import { getDefaultApplicationId } from "@/lib/env";
import DashboardView from "@/components/dashboard/DashboardView";

interface Props {
  searchParams: Promise<{ applicationId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const [applications, params] = await Promise.all([
    fetchApplications(),
    searchParams,
  ]);

  const requestedId = Number(params.applicationId);
  const defaultApplicationId =
    applications.find((app) => app.id === requestedId)?.id ??
    applications.find((app) => app.id === getDefaultApplicationId())?.id ??
    applications[0]?.id ??
    null;

  return (
    <div className="flex w-full flex-1 flex-col">
      <DashboardView
        applications={applications}
        defaultApplicationId={defaultApplicationId}
      />
    </div>
  );
}
