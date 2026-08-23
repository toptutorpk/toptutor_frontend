import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon?: string; // lucide icon name
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Find Tutors', to: '/tutors' },
  { label: 'Subjects', to: '/subjects' },
  { label: 'For Institutes', to: '/institutes' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Pricing', to: '/pricing' },
];

export const FOOTER_NAV: { title: string; links: NavItem[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Find Tutors', to: '/tutors' },
      { label: 'Browse Subjects', to: '/subjects' },
      { label: 'How Verification Works', to: '/how-it-works' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Become a Tutor', to: '/signup/tutor' },
    ],
  },
  {
    title: 'For Institutes',
    links: [
      { label: 'Hire Teachers', to: '/institutes' },
      { label: 'Teacher Database', to: '/tutors' },
      { label: 'Institute Plans', to: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    title: 'Trust & Safety',
    links: [
      { label: 'Child Safety', to: '/child-safety' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Report Misconduct', to: '/report' },
    ],
  },
];

export const STUDENT_DASHBOARD_NAV: NavItem[] = [
  { label: 'Overview', to: '/dashboard/student', icon: 'LayoutDashboard' },
  { label: 'My Bookings', to: '/dashboard/student/bookings', icon: 'CalendarCheck' },
  { label: 'Messages', to: '/dashboard/student/messages', icon: 'MessageSquare' },
  { label: 'Favorites', to: '/dashboard/student/favorites', icon: 'Heart' },
  { label: 'Payments', to: '/dashboard/student/payments', icon: 'Wallet' },
  { label: 'Reviews', to: '/dashboard/student/reviews', icon: 'Star' },
  { label: 'Profile', to: '/dashboard/student/profile', icon: 'User' },
  { label: 'Settings', to: '/dashboard/student/settings', icon: 'Settings' },
];

export const TUTOR_DASHBOARD_NAV: NavItem[] = [
  { label: 'Analytics', to: '/dashboard/tutor', icon: 'LayoutDashboard' },
  { label: 'Earnings', to: '/dashboard/tutor/earnings', icon: 'Wallet' },
  { label: 'Schedule', to: '/dashboard/tutor/schedule', icon: 'CalendarDays' },
  { label: 'Sessions', to: '/dashboard/tutor/sessions', icon: 'GraduationCap' },
  { label: 'Students', to: '/dashboard/tutor/students', icon: 'Users' },
  { label: 'Reviews', to: '/dashboard/tutor/reviews', icon: 'Star' },
  { label: 'Messages', to: '/dashboard/tutor/messages', icon: 'MessageSquare' },
  { label: 'Verification', to: '/dashboard/tutor/verification', icon: 'ShieldCheck' },
  { label: 'Profile', to: '/dashboard/tutor/profile', icon: 'User' },
  { label: 'Media', to: '/dashboard/tutor/media', icon: 'Image' },
  { label: 'Settings', to: '/dashboard/tutor/settings', icon: 'Settings' },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', to: '/admin', icon: 'LayoutDashboard' },
  { label: 'Approvals', to: '/admin/approvals', icon: 'ShieldCheck' },
  { label: 'Alerts', to: '/admin/alerts', icon: 'Bell' },
  { label: 'Tutors', to: '/admin/tutors', icon: 'GraduationCap' },
  { label: 'Students', to: '/admin/students', icon: 'Users' },
  { label: 'Institutes', to: '/admin/institutes', icon: 'Building2' },
  { label: 'Bookings', to: '/admin/bookings', icon: 'CalendarCheck' },
  { label: 'Payments', to: '/admin/payments', icon: 'Wallet' },
  { label: 'Analytics', to: '/admin/analytics', icon: 'BarChart3' },
  { label: 'Settings', to: '/admin/settings', icon: 'Settings' },
];

export const DASHBOARD_NAV_BY_ROLE: Partial<Record<UserRole, NavItem[]>> = {
  student: STUDENT_DASHBOARD_NAV,
  parent: STUDENT_DASHBOARD_NAV,
  tutor: TUTOR_DASHBOARD_NAV,
  admin: ADMIN_NAV,
};

/**
 * The portal each role belongs to — the single source of truth for "where does this account live".
 * Both the navigation links and the route guard read it, so a link can never point a tutor at a
 * section the guard would bounce them out of.
 */
export const DASHBOARD_HOME_BY_ROLE: Record<UserRole, string> = {
  student: '/dashboard/student',
  parent: '/dashboard/student',
  institute: '/dashboard/student',
  tutor: '/dashboard/tutor',
  admin: '/admin',
};

export function dashboardHome(role?: UserRole): string {
  return (role && DASHBOARD_HOME_BY_ROLE[role]) ?? '/dashboard/student';
}
