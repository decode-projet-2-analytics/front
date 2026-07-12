import { notFound } from "next/navigation";
import {
  fetchApplicationInvitations,
  fetchApplicationRole,
  fetchApplicationTeam,
} from "@/lib/applicationsApi";
import ApplicationTeamPanel from "@/components/applications/ApplicationTeamPanel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationTeamPage({ params }: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const role = await fetchApplicationRole(applicationId);
  if (!role) notFound();

  const canManageTeam = role === "owner" || role === "admin";
  const [members, invitations] = await Promise.all([
    fetchApplicationTeam(applicationId),
    canManageTeam ? fetchApplicationInvitations(applicationId) : [],
  ]);

  return (
    <ApplicationTeamPanel
      applicationId={applicationId}
      members={members}
      invitations={invitations}
      canManageTeam={canManageTeam}
    />
  );
}
