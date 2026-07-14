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
  /** Book the free intro call with a tutor — opens (or reuses) the conversation. */
  async bookIntro(tutorId: number, opts?: { childId?: number; note?: string }): Promise<BookingResult> {
    return http.post<BookingResult>('/bookings/intro', { tutorId, ...opts });
  },

  async listConversations(): Promise<ChatConversation[]> {
    return http.get<ChatConversation[]>('/conversations');
  },

  /** Total unread messages across all conversations (for the nav badge). */
  async unreadCount(): Promise<number> {
    const res = await http.get<{ count: number }>('/conversations/unread-count');
    return res.count;
  },

  async getThread(conversationId: number): Promise<ChatMessage[]> {
    return http.get<ChatMessage[]>(`/conversations/${conversationId}/messages`);
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
