import BackofficeHeader from "@/components/layout/BackofficeHeader";
import BackofficeFooter from "@/components/layout/BackofficeFooter";
import { getServerRole } from "@/lib/auth";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getServerRole();

  return (
    <div className="flex min-h-full flex-col">
      <BackofficeHeader isAdmin={role === "Admin"} />
      <main className="flex flex-1 flex-col">{children}</main>
      <BackofficeFooter />
    </div>
  );
}
