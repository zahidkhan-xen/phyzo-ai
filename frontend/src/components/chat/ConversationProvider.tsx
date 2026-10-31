"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { conversationApi } from "@/services/api";
import type { Conversation } from "@/types";

interface ConversationContextValue {
  conversations: Conversation[] | null;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );

  const refresh = useCallback(async () => {
    try {
      const response = await conversationApi.list();
      setConversations(response.conversations);
    } catch {
      setConversations((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void refresh();
    } else {
      setConversations(null);
    }
  }, [user, refresh]);

  const remove = useCallback(async (id: string) => {
    await conversationApi.remove(id);
    setConversations((current) =>
      current ? current.filter((conversation) => conversation.id !== id) : current,
    );
  }, []);

  const value = useMemo(
    () => ({ conversations, refresh, remove }),
    [conversations, refresh, remove],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversations must be used within ConversationProvider");
  }
  return context;
}
