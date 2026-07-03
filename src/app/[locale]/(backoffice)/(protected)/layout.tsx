import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getTokenServer } from "@/lib/auth";
import { fetchMe } from "@/lib/userApi";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const token = await getTokenServer();

  if (!token) {
    redirect({ href: "/login", locale });
  }

  const me = await fetchMe();
  if (!me || me.status === "pending") {
    redirect({ href: "/pending", locale });
  }
  if (me.status === "rejected") {
    redirect({ href: "/login", locale });
  }

  return <>{children}</>;
}
