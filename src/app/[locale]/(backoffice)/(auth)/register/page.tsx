import { getTranslations } from "next-intl/server";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const t = await getTranslations("Auth.register");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
