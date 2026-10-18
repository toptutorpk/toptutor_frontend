import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Banknote,
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX2,
  Coins,
  Landmark,
  MessageSquareReply,
  PauseCircle,
  ShieldCheck,
  Star,
  TimerOff,
  Video,
  Wallet,
} from 'lucide-react';

export type Meta = { icon: React.ElementType; tone: string };

const EMERALD = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400';
const BRAND = 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400';
const AMBER = 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400';
const ROSE = 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400';
const VIOLET = 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400';
const SLATE = 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300';

/** Icon and colour per notification type. An unknown type falls back to a plain bell. */
export const NOTIFICATION_META: Record<string, Meta> = {
  BOOKING_CONFIRMED: { icon: CalendarCheck, tone: EMERALD },
  NEW_BOOKING: { icon: CalendarPlus, tone: BRAND },
  SESSION_STARTING: { icon: Video, tone: BRAND },
  SESSION_ENDING: { icon: TimerOff, tone: AMBER },
  REVIEW_REQUEST: { icon: Star, tone: AMBER },
  NEW_REVIEW: { icon: Star, tone: AMBER },
  REVIEW_REPLY: { icon: MessageSquareReply, tone: VIOLET },
  SESSION_CANCELLED: { icon: CalendarX2, tone: ROSE },
  BOOKING_CANCELLED: { icon: CalendarX2, tone: ROSE },
  REFUND_SENT: { icon: Wallet, tone: EMERALD },
  VERIFICATION_UPDATE: { icon: ShieldCheck, tone: BRAND },
  PAYOUT_ACCOUNT_UPDATE: { icon: Landmark, tone: SLATE },
  PAYOUT_SENT: { icon: Banknote, tone: EMERALD },
  EARNINGS_CLEARED: { icon: Coins, tone: EMERALD },
  TUTOR_CANCELLED: { icon: CalendarX2, tone: ROSE },
  TUTOR_STRIKE: { icon: AlertTriangle, tone: AMBER },
  BOOKINGS_PAUSED: { icon: PauseCircle, tone: ROSE },
};

export function metaFor(type: string): Meta {
  return NOTIFICATION_META[type] ?? { icon: Bell, tone: SLATE };
}

export function timeAgo(iso: string): string {
  const d = parseISO(iso);
  return Date.now() - d.getTime() < 60_000 ? 'Just now' : `${formatDistanceToNowStrict(d)} ago`;
}
