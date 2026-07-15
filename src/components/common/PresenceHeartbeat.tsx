import { useEffect } from 'react';
import { presenceService } from '@/services/presenceService';
import { useAuthStore } from '@/store/authStore';

/**
 * Renders nothing; while a user is signed in it pings the presence heartbeat so their account shows
 * as "Active" to others (e.g. the green dot on tutor cards). Pings on mount, on an interval, and
 * whenever the tab regains focus. Failures are ignored — presence is best-effort.
 */
export function PresenceHeartbeat({ intervalMs = 60000 }: { intervalMs?: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const ping = () => {
      if (!cancelled) presenceService.heartbeat().catch(() => {});
    };
    ping();
    const timer = setInterval(ping, intervalMs);
    const onFocus = () => ping();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, intervalMs]);

  return null;
}
