import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Video, Home, Building2, CalendarX2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TutorCancelDialog } from '@/components/booking/TutorCancelDialog';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/StateViews';
import { useQuery } from '@tanstack/react-query';
import { JoinSessionButton } from '@/components/booking/JoinSessionButton';
import { bookingService, type TutorBooking } from '@/services/bookingService';
import { formatPKR, getInitials } from '@/lib/utils';

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

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'destructive'> = {
  upcoming: 'info',
  completed: 'success',
  cancelled: 'destructive',
};

const PAYMENT_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  NONE: 'secondary',
};

/** Minutes between two 'HH:MM' times. */
function durationMins(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export default function TutorSessions() {
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', 'tutor'],
    queryFn: bookingService.listAsTutor,
  });
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState<TutorBooking | null>(null);

  const groups: Record<string, TutorBooking[]> = {
    upcoming: bookings.filter((b) => b.status === 'UPCOMING'),
    completed: bookings.filter((b) => b.status === 'COMPLETED'),
    cancelled: bookings.filter((b) => b.status === 'CANCELLED'),
  };

  return (
    <div>
      <PageHeader title="Sessions" description="Sessions students have booked with you." />
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
                title={`No ${key} sessions`}
                description="When a student books a session, it’ll show up here."
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
                          <AvatarImage src={b.studentAvatar ?? undefined} alt={b.studentName} />
                          <AvatarFallback>{getInitials(b.studentName || 'Student')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{b.studentName || 'Student'}</span>
                            {b.bookingType === 'INTRO' && <Badge variant="gold">Trial</Badge>}
                          </div>
                          <Badge
                            variant={PAYMENT_VARIANT[b.paymentStatus] ?? 'secondary'}
                            className="mt-1 capitalize"
                          >
                            {b.paymentStatus.toLowerCase()}
                          </Badge>
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
                        {/* Same live button as the student's: "Opens 8:50 AM" earlier that day, Join in the window. */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(b.status === 'UPCOMING' || b.joinable) && (
                            <JoinSessionButton
                              bookingId={b.id}
                              joinable={b.joinable}
                              joinOpensAt={b.joinOpensAt}
                            />
                          )}
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
                          {format(parseISO(b.cancelDeadline), "d MMM 'at' h:mm a")} — if you can’t
                          attend, contact support.
                        </p>
                      )}
                      {b.status === 'CANCELLED' && b.cancelledBy && (
                        <p className="flex items-center gap-2 border-t bg-secondary/30 px-5 py-2.5 text-xs text-muted-foreground">
                          <CalendarX2 className="h-3.5 w-3.5 shrink-0" />
                          {b.cancelledBy === 'TUTOR'
                            ? 'You cancelled this session — the student was refunded in full.'
                            : 'The student cancelled this session.'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      {cancelling && <TutorCancelDialog booking={cancelling} onClose={() => setCancelling(null)} />}
    </div>
  );
}
