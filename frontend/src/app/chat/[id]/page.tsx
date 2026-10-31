import type { Metadata } from "next";
import { ChatScreen } from "@/components/chat/ChatScreen";

export const metadata: Metadata = {
  title: "Conversation",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatScreen conversationId={id} />;
}
