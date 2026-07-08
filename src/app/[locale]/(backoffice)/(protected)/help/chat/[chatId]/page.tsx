import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import SupportChat from "@/components/support/SupportChat";
import { fetchConversation, fetchMessages } from "@/lib/chatApi";
import { fetchMe } from "@/lib/userApi";

interface Props {
  params: Promise<{ chatId: string }>;
}

export default async function HelpChatPage({ params }: Props) {
  const { chatId } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Support.chat");

  const me = await fetchMe();
  if (!me) {
    redirect({ href: "/login", locale });
  }

  const [conversation, messages] = await Promise.all([
    fetchConversation(chatId),
    fetchMessages(chatId),
  ]);

  if (!conversation) {
    notFound();
  }

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col px-6 py-8 ${me!.role === "Admin" ? "max-w-5xl" : "max-w-3xl"}`}
    >
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
      <SupportChat
        conversation={conversation}
        initialMessages={messages}
        currentUserId={me!.id}
        currentUserRole={me!.role}
      />
    </div>
  );
}
