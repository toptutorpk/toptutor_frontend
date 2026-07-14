import { useQuery } from '@tanstack/react-query';
import { messagingService } from '@/services/messagingService';
import { useAuthStore } from '@/store/authStore';

/** Total unread messages for the signed-in account — powers the Messages nav badge. */
export const unreadMessagesKey = ['messages', 'unread'] as const;

export function useUnreadMessages() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: unreadMessagesKey,
    queryFn: () => messagingService.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 20000, // keep the badge fresh even without a live socket event
  });
}
