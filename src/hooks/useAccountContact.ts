import { useQuery } from '@tanstack/react-query';
import { accountService } from '@/services/accountService';
import { useAuthStore } from '@/store/authStore';

export function useAccountContact() {
  const id = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: ['account-contact', id], queryFn: accountService.me, enabled: !!id });
}
