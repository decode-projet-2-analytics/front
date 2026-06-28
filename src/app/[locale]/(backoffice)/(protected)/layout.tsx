import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getTokenServer } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getTokenServer();
  if (!token) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
  }
  return <>{children}</>;
}
