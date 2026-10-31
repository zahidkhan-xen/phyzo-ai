export type Role = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  dailyMessageLimit: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  textbookId: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  textbookId: string;
  textbookTitle: string;
  pageNumber: number;
  chunkId: string;
  score: number;
  excerpt: string;
}

export interface MessageUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  cached: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  usage: MessageUsage | null;
  createdAt: string;
  pending?: boolean;
}

export interface Textbook {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  originalName?: string;
  fileSize?: number;
  pageCount: number;
  chunkCount: number;
  status?: "processing" | "ready" | "failed";
  progress?: number;
  error?: string | null;
  embeddingTokens?: number;
  embeddingCostUsd?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface SendMessageResponse {
  conversation: Conversation;
  userMessage: Message;
  message?: string;
  assistantMessage: Message;
  cached: boolean;
  remainingMessages: number;
}

export interface UsageSummary {
  requests: number;
  cachedRequests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export interface AdminStats {
  users: number;
  admins: number;
  conversations: number;
  messages: number;
  chunks: number;
  textbooks: {
    total: number;
    ready: number;
    processing: number;
    failed: number;
  };
  usageToday: UsageSummary;
  usageAllTime: UsageSummary;
}

export interface ApiErrorBody {
  message?: string;
  details?: unknown;
}
