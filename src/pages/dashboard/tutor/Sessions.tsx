import { useState } from 'react';
import { format } from 'date-fns';
import { Video, Home, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/StateViews';
import { useQuery } from '@tanstack/react-query';
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
              <EmptyState title={`No ${key} sessions`} description="When a student books a session, it’ll show up here." />
            ) : (
              <div className="space-y-3">
                {list.map((b) => {
                  const I = MODE_ICON(b.mode);
                  const statusKey = b.status.toLowerCase();
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center"
                    >
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={b.studentAvatar ?? undefined} alt={b.studentName} />
                        <AvatarFallback>{getInitials(b.studentName || 'Student')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{b.studentName || 'Student'}</span>
                          {b.bookingType === 'INTRO' && <Badge variant="gold">Trial</Badge>}
                        </div>
                        <Badge variant={PAYMENT_VARIANT[b.paymentStatus] ?? 'secondary'} className="mt-1 capitalize">
                          {b.paymentStatus.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{format(new Date(`${b.sessionDate}T00:00:00`), 'EEE, MMM d')}</div>
                        <div className="text-muted-foreground">
                          {b.startTime}–{b.endTime} · {durationMins(b.startTime, b.endTime)} min
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[statusKey] ?? 'info'} className="gap-1 capitalize">
                        <I className="h-3 w-3" /> {statusKey}
                      </Badge>
                      <div className="font-display font-bold">{b.amount != null ? formatPKR(b.amount) : '—'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
