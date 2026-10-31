import type {
  AdminStats,
  ApiErrorBody,
  Conversation,
  ConversationDetail,
  SendMessageResponse,
  Textbook,
  User,
} from "@/types";

function resolveApiBaseUrl(): string {
  const configured = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api"
  ).replace(/\/$/, "");

  if (typeof window === "undefined") return configured;

  try {
    const url = new URL(configured);
    const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
    if (
      loopbackHosts.has(url.hostname) &&
      url.hostname !== window.location.hostname
    ) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return configured;
  }

  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

export class ApiClientError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errorBody = (body ?? {}) as ApiErrorBody;
    throw new ApiClientError(
      response.status,
      errorBody.message || `Request failed with status ${response.status}`,
      errorBody.details,
    );
  }

  return body as T;
}

export const authApi = {
  me: () => request<{ user: User }>("/auth/me"),

  login: (data: { email: string; password: string }) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: { name: string; email: string; password: string }) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>("/auth/logout", { method: "POST" }),

  updateProfile: (data: { name?: string; email?: string }) =>
    request<{ user: User }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) =>
    request<{ message: string }>("/auth/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const conversationApi = {
  list: () =>
    request<{ conversations: Conversation[] }>("/conversations"),

  get: (id: string) =>
    request<ConversationDetail>(`/conversations/${id}`),

  create: (data: { title?: string; textbookId?: string | null } = {}) =>
    request<{ conversation: Conversation }>("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: { title?: string; textbookId?: string | null },
  ) =>
    request<{ conversation: Conversation }>(`/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<{ message: string }>(`/conversations/${id}`, {
      method: "DELETE",
    }),
};

export const chatApi = {
  send: (data: {
    message: string;
    conversationId?: string;
    textbookId?: string | null;
  }) =>
    request<SendMessageResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const textbookApi = {
  list: () => request<{ textbooks: Textbook[] }>("/textbooks"),
};

export const adminApi = {
  stats: () => request<AdminStats>("/admin/stats"),

  textbooks: () => request<{ textbooks: Textbook[] }>("/admin/textbooks"),

  users: () =>
    request<{
      users: User[];
    }>("/admin/users"),

  upload: (formData: FormData) =>
    request<{ textbook: Textbook; message: string }>("/admin/textbooks", {
      method: "POST",
      body: formData,
    }),

  reindex: (id: string) =>
    request<{ textbook: Textbook; message: string }>(
      `/admin/textbooks/${id}/reindex`,
      { method: "POST" },
    ),

  removeTextbook: (id: string) =>
    request<{ message: string }>(`/admin/textbooks/${id}`, {
      method: "DELETE",
    }),

  updateUser: (
    id: string,
    data: { role?: "student" | "admin"; dailyMessageLimit?: number },
  ) =>
    request<{ user: User }>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
