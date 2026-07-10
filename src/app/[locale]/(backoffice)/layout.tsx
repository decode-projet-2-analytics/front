import BackofficeHeader from "@/components/layout/BackofficeHeader";
import BackofficeFooter from "@/components/layout/BackofficeFooter";
import ImpersonateBanner from "@/components/admin/ImpersonateBanner";
import {
  getServerRole,
  getAdminTokenServer,
  getImpersonatedEmail,
} from "@/lib/auth";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getServerRole();
  const adminToken = await getAdminTokenServer();
  const impersonatedEmail = adminToken ? await getImpersonatedEmail() : null;

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {impersonatedEmail && <ImpersonateBanner email={impersonatedEmail} />}
      <BackofficeHeader isAdmin={role === "Admin"} />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <BackofficeFooter />
    </div>
  );
}
