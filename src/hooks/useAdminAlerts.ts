import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/authStore';

/** Count of open admin alerts (violations etc.) — powers the admin "Alerts" nav badge. */
export const adminAlertCountKey = ['admin', 'notifications', 'count'] as const;

export function useAdminAlertCount() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminAlertCountKey,
    queryFn: () => adminService.notificationCount(),
    enabled: isAdmin, // never call the admin endpoint as a non-admin
    refetchInterval: 30000,
  });
}
