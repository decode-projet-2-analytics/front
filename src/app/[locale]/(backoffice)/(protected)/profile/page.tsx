import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function ProfileIndexPage() {
  const locale = await getLocale();
  redirect({ href: "/profile/account", locale });
}
