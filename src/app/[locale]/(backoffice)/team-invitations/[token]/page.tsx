import AcceptTeamInvitation from "@/components/applications/AcceptTeamInvitation";
import { isAuthenticated } from "@/lib/auth";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function TeamInvitationPage({ params }: Props) {
  const { token } = await params;
  const authenticated = await isAuthenticated();

  return <AcceptTeamInvitation token={token} authenticated={authenticated} />;
}
