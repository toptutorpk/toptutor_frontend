import { http } from '@/api/client';

/** One item in the bell. Mirrors the server's UserNotificationView. */
export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  /** In-app path the click opens. */
  link: string | null;
  read: boolean;
  /** ISO instant. */
  createdAt: string;
}

export const notificationService = {
  list: (opts: { unread?: boolean; page?: number; size?: number } = {}) =>
    http.getPage<AppNotification>('/notifications', {
      params: { unread: opts.unread ?? false, page: opts.page ?? 0, size: opts.size ?? 20 },
    }),
  unreadCount: () =>
    http.get<{ count: number }>('/notifications/unread-count').then((r) => r.count),
  markRead: (id: number) => http.post<void>(`/notifications/${id}/read`),
  markAllRead: () => http.post<{ updated: number }>('/notifications/read-all'),
};
