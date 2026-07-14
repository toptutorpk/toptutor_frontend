import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { getAccessToken } from '@/api/client';
import { env } from '@/config/env';
import type { ChatMessage } from '@/services/messagingService';

/* ============================================================================
   Live messaging over STOMP/WebSocket.

   Connects to the backend `/ws` endpoint, authenticating the CONNECT frame with
   the same JWT the REST API uses, and subscribes to the current user's private
   queues: new messages, delivery/read receipts, and typing indicators.

   This is an enhancement layer — the REST endpoints remain the source of truth
   (unread counts, delivered/read timestamps), so if the socket drops the UI's
   polling still keeps things fresh. Callbacks are kept in a ref so the socket is
   only rebuilt when the token changes, not on every render.
   ========================================================================== */

export interface ReceiptEvent {
  type: 'delivered' | 'read';
  conversationId: number;
}

export interface TypingEvent {
  conversationId: number;
  fromAccountId: number;
  typing: boolean;
}

interface Handlers {
  onMessage?: (message: ChatMessage) => void;
  onReceipt?: (event: ReceiptEvent) => void;
  onTyping?: (event: TypingEvent) => void;
  onStatusChange?: (connected: boolean) => void;
}

/** Derives the ws(s):// broker URL from the REST base URL (…/api/v1 → …/ws). */
function brokerUrl(): string {
  const origin = env.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  return origin.replace(/^http/, 'ws') + '/ws';
}

export function useMessagingSocket(handlers: Handlers, enabled: boolean = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!enabled || !token) return;

    const client = new Client({
      brokerURL: brokerUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      handlersRef.current.onStatusChange?.(true);
      client.subscribe('/user/queue/messages', (frame) => {
        handlersRef.current.onMessage?.(JSON.parse(frame.body) as ChatMessage);
      });
      client.subscribe('/user/queue/receipts', (frame) => {
        handlersRef.current.onReceipt?.(JSON.parse(frame.body) as ReceiptEvent);
      });
      client.subscribe('/user/queue/typing', (frame) => {
        handlersRef.current.onTyping?.(JSON.parse(frame.body) as TypingEvent);
      });
    };
    client.onWebSocketClose = () => handlersRef.current.onStatusChange?.(false);
    client.onStompError = () => handlersRef.current.onStatusChange?.(false);

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      void client.deactivate();
    };
  }, [enabled]);

  /** Publishes a typing indicator for a conversation (best-effort; no-op if disconnected). */
  const sendTyping = (conversationId: number, typing: boolean) => {
    const client = clientRef.current;
    if (client?.connected) {
      client.publish({
        destination: '/app/typing',
        body: JSON.stringify({ conversationId, typing }),
      });
    }
  };

  return { sendTyping };
}
