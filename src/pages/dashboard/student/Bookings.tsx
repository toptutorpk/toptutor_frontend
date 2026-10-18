import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addHours, format, parseISO } from 'date-fns';
import {
  Video,
  Home,
  Building2,
  CalendarX2,
  CheckCircle2,
  Clock,
  Hourglass,
  Star,
  Wallet,
} from 'lucide-react';
import { RefundDestinationDialog } from '@/components/booking/RefundDestinationDialog';
import { CancelSessionDialog } from '@/components/booking/CancelSessionDialog';
import type { LearnerRefund } from '@/services/refundService';
import { ReceiptButton } from '@/components/booking/ReceiptButton';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/StateViews';
import { useQuery } from '@tanstack/react-query';
import { JoinSessionButton } from '@/components/booking/JoinSessionButton';
import { queryKeys } from '@/api/queryKeys';
import { bookingService, type BookingSummary } from '@/services/bookingService';
import { cn, formatPKR, getInitials } from '@/lib/utils';

// Backend slot mode (ONLINE/HOME/DEMO) → an icon. Falls back to the online icon.
const MODE_ICON = (mode: string | null) => {
  switch (mode) {
    case 'HOME':
      return Home;
    case 'DEMO':
      return Building2;
    default:
      return Video; // ONLINE / null
  }
};

// Derived backend status (UPCOMING/COMPLETED/CANCELLED) → badge variant + tab key.
const STATUS_VARIANT: Record<string, 'info' | 'success' | 'destructive' | 'warning'> = {
  upcoming: 'info',
  completed: 'success',
  cancelled: 'destructive',
};

/** Minutes between two 'HH:MM' times. */
function durationMins(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export default function StudentBookings() {
  const { data: bookings = [] } = useQuery({
    queryKey: queryKeys.bookings.all,
    queryFn: bookingService.list,
  });
  const navigate = useNavigate();
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState<BookingSummary | null>(null);
  const [claiming, setClaiming] = useState<BookingSummary | null>(null);

  // Arriving from the "your tutor cancelled" email or notification (?refund=<booking id>): open the
  // refund-details dialog straight away, once, if that refund is still waiting for them.
  const [params, setParams] = useSearchParams();
  const refundParam = Number(params.get('refund')) || null;
  useEffect(() => {
    if (!refundParam) return;
    const target = bookings.find((b) => b.id === refundParam);
    if (!target) return;
    if (target.refund?.status === 'AWAITING_DETAILS') {
      setTab('cancelled');
      setClaiming(target);
    }
    setParams(
      (p) => {
        p.delete('refund');
        return p;
      },
      { replace: true },
    );
  }, [refundParam, bookings, setParams]);

  const groups: Record<string, BookingSummary[]> = {
    upcoming: bookings.filter((b) => b.status === 'UPCOMING'),
    completed: bookings.filter((b) => b.status === 'COMPLETED'),
    cancelled: bookings.filter((b) => b.status === 'CANCELLED'),
  };

  return (
    <div>
      <PageHeader
        title="My Bookings"
        description="Manage your sessions, reschedule or join live."
      />
      <RefundSentBanner bookings={bookings} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({groups.upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({groups.completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({groups.cancelled.length})</TabsTrigger>
        </TabsList>

        {Object.entries(groups).map(([key, list]) => (
          <TabsContent key={key} value={key}>
            {list.length === 0 ? (
              <EmptyState
                title={`No ${key} bookings`}
                description="When you book a session, it’ll show up here."
              />
            ) : (
              <div className="space-y-3">
                {list.map((b) => {
                  const I = MODE_ICON(b.mode);
                  const statusKey = b.status.toLowerCase();
                  return (
                    <div
                      key={b.id}
                      className="overflow-hidden rounded-2xl border bg-card shadow-soft"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={b.tutorAvatar ?? undefined} alt={b.tutorName} />
                          <AvatarFallback>{getInitials(b.tutorName || 'Tutor')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{b.tutorName || 'Tutor'}</span>
                            {b.bookingType === 'INTRO' && <Badge variant="gold">Trial</Badge>}
                          </div>
                          {/* Subject is not yet modelled on a booking — decision pending. */}
                          {/* <div className="text-sm text-muted-foreground">{b.subject}</div> */}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(`${b.sessionDate}T00:00:00`), 'EEE, MMM d')}
                          </div>
                          <div className="text-muted-foreground">
                            {b.startTime}–{b.endTime} · {durationMins(b.startTime, b.endTime)} min
                          </div>
                        </div>
                        <Badge
                          variant={STATUS_VARIANT[statusKey] ?? 'info'}
                          className="gap-1 capitalize"
                        >
                          <I className="h-3 w-3" /> {statusKey}
                        </Badge>
                        <div className="font-display font-bold">
                          {b.amount != null ? formatPKR(b.amount) : '—'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {(b.status === 'UPCOMING' || b.joinable) && (
                            <JoinSessionButton
                              bookingId={b.id}
                              joinable={b.joinable}
                              joinOpensAt={b.joinOpensAt}
                            />
                          )}
                          {/* Gone once reviewed — one review per booking. */}
                          {b.status === 'COMPLETED' &&
                            b.paymentStatus === 'PAID' &&
                            !b.reviewed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(`/dashboard/student/reviews?booking=${b.id}`)
                                }
                              >
                                <Star /> Review
                              </Button>
                            )}
                          {b.paymentStatus === 'PAID' && <ReceiptButton bookingId={b.id} />}
                          {b.status === 'UPCOMING' && b.cancellable && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-200 bg-white font-semibold text-red-600 shadow-none hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-border dark:bg-card dark:text-red-400 dark:hover:bg-red-500/10"
                              onClick={() => setCancelling(b)}
                            >
                              <CalendarX2 /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      {b.status === 'UPCOMING' && !b.cancellable && b.cancelDeadline && (
                        <p className="flex items-center gap-2 border-t bg-secondary/30 px-5 py-2.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          Cancellation closed{' '}
                          {format(parseISO(b.cancelDeadline), "d MMM 'at' h:mm a")} — this session
                          can no longer be cancelled or refunded.
                        </p>
                      )}
                      {b.refund && <RefundStrip refund={b.refund} onClaim={() => setClaiming(b)} />}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {claiming && <RefundDestinationDialog booking={claiming} onClose={() => setClaiming(null)} />}
      {cancelling && (
        <CancelSessionDialog booking={cancelling} onClose={() => setCancelling(null)} />
      )}
    </div>
  );
}

/** Under a cancelled booking: where its refund is, in one line. */
function RefundStrip({ refund, onClaim }: { refund: LearnerRefund; onClaim: () => void }) {
  const sent = refund.status === 'REFUNDED';
  if (refund.status === 'AWAITING_DETAILS') {
    // The tutor cancelled: nothing can be sent until the learner says where.
    return (
      <div className="flex flex-col gap-3 border-t bg-rose-50/70 px-5 py-3 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-200 sm:flex-row sm:items-center">
        <CalendarX2 className="hidden h-4 w-4 shrink-0 sm:block" />
        <span className="flex-1">
          <span className="font-semibold">Your tutor cancelled this session.</span> You’ll get a
          full refund of {formatPKR(refund.refundAmount)} — tell us where to send it.
        </span>
        <Button size="sm" variant="gradient" onClick={onClaim}>
          <Wallet /> Get my refund
        </Button>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-5 py-3 text-sm',
        sent
          ? 'bg-emerald-50/70 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
          : 'bg-amber-50/70 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
      )}
    >
      {sent ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <Hourglass className="h-4 w-4 shrink-0" />
      )}
      <span className="font-semibold">{sent ? 'Refunded' : 'Refund pending'}</span>
      <span>
        {formatPKR(refund.refundAmount)} to {refund.provider} {refund.accountMasked}
      </span>
      <span className="text-xs opacity-80">
        {sent && refund.refundedAt
          ? `Sent ${format(parseISO(refund.refundedAt), 'd MMM yyyy')}${refund.reference ? ` · Ref ${refund.reference}` : ''}`
          : refund.cancelledBy === 'TUTOR'
            ? 'Full refund — your tutor cancelled'
            : `Expected by ${format(addHours(parseISO(refund.requestedAt), 24), "d MMM 'at' h:mm a")} · ${formatPKR(refund.feeAmount)} processing fee kept`}
      </span>
    </div>
  );
}

const SEEN_KEY = 'toptutor.refundsSeen';

function readSeen(): number[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as number[];
  } catch {
    return [];
  }
}

/**
 * "Your refund has been sent" — shown once per refund until dismissed, for refunds sent in the last
 * two weeks. Dismissal is remembered on this device only; the email is the durable record.
 */
function RefundSentBanner({ bookings }: { bookings: BookingSummary[] }) {
  const [seen, setSeen] = useState<number[]>(readSeen);
  const fresh = bookings
    .map((b) => b.refund)
    .filter((r): r is LearnerRefund => !!r && r.status === 'REFUNDED' && !!r.refundedAt)
    .filter((r) => Date.now() - parseISO(r.refundedAt!).getTime() < 14 * 24 * 3600_000)
    .filter((r) => !seen.includes(r.id));
  if (fresh.length === 0) return null;
  const r = fresh[0];
  const dismiss = () => {
    const next = [...seen, ...fresh.map((x) => x.id)];
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {
      /* private mode — the banner simply shows again next time */
    }
  };
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-emerald-900 dark:text-emerald-100">
          Your refund of {formatPKR(r.refundAmount)} has been sent
          {fresh.length > 1 && ` (and ${fresh.length - 1} more)`}
        </p>
        <p className="text-emerald-800/80 dark:text-emerald-200/80">
          To {r.provider} {r.accountMasked}
          {r.reference && ` · Reference ${r.reference}`}. It can take a few hours to show in your
          account.
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
