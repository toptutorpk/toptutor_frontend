import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@stomp/stompjs';
import { getAccessToken } from '@/api/client';
import { env } from '@/config/env';
import { notificationService, type AppNotification } from '@/services/notificationService';

export const notificationKeys = {
  latest: ['notifications', 'latest'] as const,
  count: ['notifications', 'count'] as const,
  page: (unread: boolean, page: number) => ['notifications', 'page', unread, page] as const,
};

/** The …/api/v1 base → …/ws, or the page origin when the API is same-origin (Vite proxy / tunnel). */
function brokerUrl(): string {
  const base = env.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  const origin = /^https?:\/\//.test(base) ? base : window.location.origin;
  return origin.replace(/^http/, 'ws') + '/ws';
}

/**
 * The bell's data: the latest notifications and the unread count, kept live.
 *
 * <p>REST is the source of truth — loaded on mount and refreshed every minute — and the WebSocket
 * only makes it instant: a pushed notification is put at the top of the list and the count bumped
 * straight away. If the socket is down nothing breaks; the minute's poll catches up.
 *
 * @param onArrive called for each notification pushed live (the bell shows a toast with it)
 * @param live     hold the WebSocket. Only the bell does — a second subscriber in the same tab would
 *                 count every pushed notification twice. Other screens reuse the cache and actions.
 */
export function useNotifications(
  onArrive?: (n: AppNotification) => void,
  { enabled = true, live = true }: { enabled?: boolean; live?: boolean } = {},
) {
  const qc = useQueryClient();
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  const latest = useQuery({
    queryKey: notificationKeys.latest,
    queryFn: () => notificationService.list({ size: 15 }).then((p) => p.items),
    enabled,
    refetchInterval: 60_000,
  });
  const count = useQuery({
    queryKey: notificationKeys.count,
    queryFn: notificationService.unreadCount,
    enabled,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!enabled || !live || !token) return;
    const client = new Client({
      brokerURL: brokerUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
    client.onConnect = () => {
      client.subscribe('/user/queue/notifications', (frame) => {
        const n = JSON.parse(frame.body) as AppNotification;
        qc.setQueryData<AppNotification[]>(notificationKeys.latest, (prev = []) =>
          prev.some((p) => p.id === n.id) ? prev : [n, ...prev].slice(0, 15),
        );
        qc.setQueryData<number>(notificationKeys.count, (c = 0) => c + 1);
        void qc.invalidateQueries({ queryKey: ['notifications', 'page'] });
        onArriveRef.current?.(n);
      });
    };
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [enabled, live, qc]);

  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    onMutate: (id: number) => {
      // Optimistic: the dot goes the moment it's clicked; the server agrees a beat later.
      let wasUnread = false;
      qc.setQueryData<AppNotification[]>(notificationKeys.latest, (prev = []) =>
        prev.map((n) => {
          if (n.id === id && !n.read) wasUnread = true;
          return n.id === id ? { ...n, read: true } : n;
        }),
      );
      if (wasUnread) qc.setQueryData<number>(notificationKeys.count, (c = 1) => Math.max(0, c - 1));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.count });
      void qc.invalidateQueries({ queryKey: ['notifications', 'page'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: notificationService.markAllRead,
    onMutate: () => {
      qc.setQueryData<AppNotification[]>(notificationKeys.latest, (prev = []) =>
        prev.map((n) => ({ ...n, read: true })),
      );
      qc.setQueryData<number>(notificationKeys.count, 0);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    items: latest.data ?? [],
    loading: latest.isLoading,
    unread: count.data ?? 0,
    markRead: (id: number) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
