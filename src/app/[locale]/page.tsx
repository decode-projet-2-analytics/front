import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("Home");
  return <div>{t("title")}</div>;
}
