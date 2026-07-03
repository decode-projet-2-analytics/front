import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getServerRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const role = await getServerRole();

  if (role !== "Admin") {
    redirect({ href: "/dashboard", locale });
  }

  return <>{children}</>;
}
