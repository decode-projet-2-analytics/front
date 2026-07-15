import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getTokenServer } from "@/lib/auth";
import { fetchMe } from "@/lib/userApi";
import { NotificationsProvider } from "@/context/NotificationsProvider";
import { Toaster } from "sonner";

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
  if (!me || me.status === "rejected") {
    redirect({ href: "/login", locale });
  }
  if (me?.status === "pending") {
    redirect({ href: "/pending", locale });
  }

  return (
    <NotificationsProvider userRole={me!.role}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </NotificationsProvider>
  );
}
