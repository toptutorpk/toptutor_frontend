import { useState } from 'react';
import { format } from 'date-fns';
import { Video, Home, Building2, Receipt } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/StateViews';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { bookingService, type BookingSummary } from '@/services/bookingService';
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
  const [tab, setTab] = useState('upcoming');

  const groups: Record<string, BookingSummary[]> = {
    upcoming: bookings.filter((b) => b.status === 'UPCOMING'),
    completed: bookings.filter((b) => b.status === 'COMPLETED'),
    cancelled: bookings.filter((b) => b.status === 'CANCELLED'),
  };

  return (
    <div>
      <PageHeader title="My Bookings" description="Manage your sessions, reschedule or join live." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({groups.upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({groups.completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({groups.cancelled.length})</TabsTrigger>
        </TabsList>

        {Object.entries(groups).map(([key, list]) => (
          <TabsContent key={key} value={key}>
            {list.length === 0 ? (
              <EmptyState title={`No ${key} bookings`} description="When you book a session, it’ll show up here." />
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
                        <div className="font-medium">{format(new Date(`${b.sessionDate}T00:00:00`), 'EEE, MMM d')}</div>
                        <div className="text-muted-foreground">
                          {b.startTime}–{b.endTime} · {durationMins(b.startTime, b.endTime)} min
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[statusKey] ?? 'info'} className="gap-1 capitalize">
                        <I className="h-3 w-3" /> {statusKey}
                      </Badge>
                      <div className="font-display font-bold">{b.amount != null ? formatPKR(b.amount) : '—'}</div>
                      <div className="flex gap-2">
                        {b.status === 'UPCOMING' && b.canMessage && (
                          <Button size="sm" variant="gradient">Join</Button>
                        )}
                        {b.status === 'COMPLETED' && <Button size="sm" variant="outline">Review</Button>}
                        {b.paymentStatus === 'PAID' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              bookingService
                                .openReceipt(b.id)
                                .catch(() => toast.error('Could not open receipt'))
                            }
                          >
                            <Receipt className="h-3.5 w-3.5" /> Receipt
                          </Button>
                        )}
                      </div>
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
