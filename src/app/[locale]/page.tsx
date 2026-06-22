import LoginForm from "../components/LoginForm";
import { useTranslations } from "next-intl";

export default async function Page() {
  const t = await useTranslations("Home");
  return <div>{t("title")}</div>;
}