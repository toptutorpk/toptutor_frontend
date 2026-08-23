import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { dashboardHome } from '@/constants/navigation';

/**
 * Keeps every account inside its own portal. Authentication alone is not enough here: a tutor who
 * lands on /dashboard/student — from a stale link, a typed URL, or a mis-targeted menu item — would
 * otherwise be shown the learner dashboard with the learner sidebar, and could walk from there into
 * pages that role has no business seeing.
 *
 * <p>The section a route belongs to is compared against {@link dashboardHome} for the signed-in
 * role, which is also what the redirect targets. Guard and destination therefore agree by
 * construction, so no role can be bounced into a redirect loop.
 */
export function DashboardSectionRoute({ section }: { section: string }) {
  const user = useAuthStore((s) => s.user);
  const home = dashboardHome(user?.role);

  if (home !== section) {
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}

/** Sends bare /dashboard to whichever portal the signed-in account actually owns. */
export function DashboardHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={dashboardHome(user?.role)} replace />;
}
