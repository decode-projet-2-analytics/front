export function getApplicationCapabilities(globalRole, applicationRole) {
  if (globalRole === "Admin") {
    return {
      read: false,
      manage: false,
      manageSessions: false,
      deleteApplication: false,
    };
  }

  return {
    read: applicationRole === "member" || applicationRole === "admin" || applicationRole === "owner",
    manage: applicationRole === "admin" || applicationRole === "owner",
    manageSessions: applicationRole === "owner",
    deleteApplication: applicationRole === "owner",
  };
}
