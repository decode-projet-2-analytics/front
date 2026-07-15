export function startCookieTransition(adminToken, impersonatedToken) {
  return {
    accessToken: impersonatedToken,
    adminToken,
  };
}

export function stopCookieTransition(adminToken) {
  return {
    accessToken: adminToken,
    deleteAdminToken: true,
  };
}
