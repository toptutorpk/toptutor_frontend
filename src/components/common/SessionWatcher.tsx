import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onSessionEnded, type SessionEndedReason } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

/** What the login screen says, per reason. */
const REASON_MESSAGE: Record<SessionEndedReason, string> = {
  IDLE_TIMEOUT: 'You were signed out after a period of inactivity. Please sign in again.',
  SESSION_EXPIRED: 'Your session reached its maximum length. Please sign in again.',
  INVALID: 'Your session has ended. Please sign in again.',
};

/**
 * Turns a session ending server-side into the app actually signing out.
 *
 * <p>Mounted once, above the routes. Until this existed, an expired session cleared the stored
 * tokens and nothing else: the auth store kept its own persisted `isAuthenticated`, so the guard on
 * every protected route still let the person through and they sat on a dashboard where every
 * request failed — no redirect, no message, no way to tell it apart from the product being broken.
 *
 * <p>It lives inside the router because redirecting is the point, and it carries the page they were
 * on so signing in returns them there rather than to a default landing page.
 */
export function SessionWatcher() {
  const endSession = useAuthStore((s) => s.endSession);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onSessionEnded((reason) => {
      endSession();
      navigate('/login', {
        replace: true,
        state: {
          // `from` is what the login page already uses to send someone back where they were.
          from: location.pathname,
          sessionEndedMessage: REASON_MESSAGE[reason],
        },
      });
    });
    // location.pathname is read inside the handler, so the subscription is refreshed as it changes
    // — otherwise a session ending on page B would send the person back to page A.
  }, [endSession, navigate, location.pathname]);

  return null;
}
