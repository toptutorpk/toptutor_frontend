import { http } from '@/api/client';

/* ============================================================================
   Messaging service — talks to the real backend messaging API.

   A learner must book a tutor (the free intro call) before a conversation
   exists; from then on both sides chat in-app. Contact details are stripped
   server-side, so `redacted` on a message means something was masked.
   ========================================================================== */

/** A conversation row, already framed from the viewer's perspective by the backend. */
export interface ChatConversation {
  id: number;
  participantAccountId: number;
  participantName: string;
  participantAvatar?: string | null;
  participantRole: string; // TUTOR | STUDENT | PARENT
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unread: number;
  status: string; // ACTIVE | ARCHIVED | BLOCKED
}

/** A single message. `body` is already redacted; ticks come from delivered/read timestamps. */
export interface ChatMessage {
  id: number;
  conversationId: number;
  senderAccountId: number;
  body: string;
  redacted: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface BookingResult {
  id: number;
  tutorAccountId: number;
  conversationId: number;
  status: string;
}

export const messagingService = {
  /**
   * Request the tutor's free intro call. Records an INTRO booking and opens the conversation.
   * Only for tutors who actually offer a demo slot — to just start a chat use
   * {@link startConversation}, which books nothing.
   */
  async bookIntro(tutorId: number, opts?: { childId?: number; note?: string }): Promise<BookingResult> {
    return http.post<BookingResult>('/bookings/intro', { tutorId, ...opts });
  },

  /** Open (or reuse) a chat with a tutor. Idempotent, and records no booking. */
  async startConversation(tutorId: number): Promise<{ conversationId: number }> {
    return http.post<{ conversationId: number }>('/conversations', { tutorId });
  },

  async listConversations(): Promise<ChatConversation[]> {
    return http.get<ChatConversation[]>('/conversations', { params: { size: 100 } });
  },

  /** Total unread messages across all conversations (for the nav badge). */
  async unreadCount(): Promise<number> {
    const res = await http.get<{ count: number }>('/conversations/unread-count');
    return res.count;
  },

  /** The latest page of a thread (oldest → newest). See {@link getThreadPage} to walk into history. */
  async getThread(conversationId: number): Promise<ChatMessage[]> {
    return (await this.getThreadPage(conversationId)).messages;
  },

  /**
   * A keyset page of a thread. Without `before` it is the newest messages; pass the previous
   * page's `nextCursor` as `before` to get the page of older ones. Offsets would drift as new
   * messages arrive; an id cursor never does.
   */
  async getThreadPage(
    conversationId: number,
    before?: string | null,
    limit = 50,
  ): Promise<{ messages: ChatMessage[]; nextCursor: string | null; hasMore: boolean }> {
    const page = await http.getCursorPage<ChatMessage>(`/conversations/${conversationId}/messages`, {
      params: { limit, ...(before ? { before } : {}) },
    });
    return { messages: page.items, nextCursor: page.nextCursor, hasMore: page.hasMore };
  },

  /** Sends a message. The returned message reflects any server-side redaction. */
  async sendMessage(conversationId: number, body: string): Promise<ChatMessage> {
    return http.post<ChatMessage>(`/conversations/${conversationId}/messages`, { body });
  },

  async markRead(conversationId: number): Promise<void> {
    await http.post(`/conversations/${conversationId}/read`);
  },

  async report(conversationId: number, reason: string, detail?: string): Promise<void> {
    await http.post(`/conversations/${conversationId}/report`, { reason, detail });
  },
};
