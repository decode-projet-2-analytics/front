import type { ApplicationTeamRole } from "./applicationsApi";

export interface ApplicationCapabilities {
  read: boolean;
  manage: boolean;
  manageSessions: boolean;
  deleteApplication: boolean;
}

export function getApplicationCapabilities(
  globalRole: string | null,
  applicationRole: ApplicationTeamRole | null,
): ApplicationCapabilities;
