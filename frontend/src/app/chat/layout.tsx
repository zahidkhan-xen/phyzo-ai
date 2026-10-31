import { ConversationProvider } from "@/components/chat/ConversationProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/sidebar/Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ConversationProvider>
        <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
          <Sidebar />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </ConversationProvider>
    </ProtectedRoute>
  );
}
