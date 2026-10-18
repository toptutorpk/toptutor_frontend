import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { CalendarDays, Home, Monitor, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardListCard } from '@/components/tutor/DashboardListCard';
import { bookingService, type TutorBooking } from '@/services/bookingService';
import { formatPKR, getInitials } from '@/lib/utils';

const SHOWN = 4;

/**
 * The next few classes the tutor has booked.
 *
 * <p>The most actionable thing on the page: a dashboard should answer "what is coming" before it
 * answers "how did last month go". Reads the same endpoint as the Sessions page, so the two can
 * never disagree about what is booked.
 */
export function UpcomingSessionsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'tutor'],
    queryFn: bookingService.listAsTutor,
  });

  const upcoming = (data ?? [])
    .filter((b) => b.status === 'UPCOMING')
    // Chronological: the soonest class is the one that matters, and the endpoint makes no promise
    // about order.
    .sort((a, b) => `${a.sessionDate}T${a.startTime}`.localeCompare(`${b.sessionDate}T${b.startTime}`))
    .slice(0, SHOWN);

  return (
    <DashboardListCard
      title="Next sessions"
      icon={CalendarDays}
      to="/dashboard/tutor/sessions"
      linkLabel="All sessions"
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-2">
          {upcoming.map((booking) => (
            <SessionRow key={booking.id} booking={booking} />
          ))}
        </ul>
      )}
    </DashboardListCard>
  );
}

function SessionRow({ booking }: { booking: TutorBooking }) {
  const Icon = booking.mode === 'HOME' ? Home : booking.mode === 'DEMO' ? Sparkles : Monitor;
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-secondary/20 p-3">
      <Avatar className="h-9 w-9 shrink-0">
        {booking.studentAvatar && <AvatarImage src={booking.studentAvatar} alt="" />}
        <AvatarFallback>{getInitials(booking.studentName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{booking.studentName}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Icon className="h-3 w-3 shrink-0" />
          {whenLabel(booking.sessionDate)} · {booking.startTime}–{booking.endTime}
        </p>
      </div>
      {booking.bookingType === 'INTRO' ? (
        <Badge variant="secondary">Intro</Badge>
      ) : (
        booking.amount != null && (
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {formatPKR(booking.amount)}
          </span>
        )
      )}
    </li>
  );
}

/** "Today" and "Tomorrow" read faster than a date on the two days a tutor most needs to act. */
function whenLabel(sessionDate: string) {
  const date = parseISO(sessionDate);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE d MMM');
}

function Empty() {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">No sessions booked yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Open slots on your schedule so students can book you.
      </p>
      <Button variant="outline" size="sm" className="mt-3" asChild>
        <Link to="/dashboard/tutor/schedule">Manage schedule</Link>
      </Button>
    </div>
  );
}

