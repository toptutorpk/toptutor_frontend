import { useState } from 'react';
import { format } from 'date-fns';
import { Video, Home, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/StateViews';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { contentService } from '@/services/contentService';
import { formatPKR, getInitials } from '@/lib/utils';
import type { Booking, SessionMode } from '@/types';

const MODE_ICON: Record<SessionMode, typeof Video> = { online: Video, home_visit: Home, institute: Building2 };

const STATUS_VARIANT = {
  upcoming: 'info',
  completed: 'success',
  cancelled: 'destructive',
  pending: 'warning',
} as const;

export default function StudentBookings() {
  const { data: bookings = [] } = useQuery({ queryKey: queryKeys.bookings.all, queryFn: contentService.bookings });
  const [tab, setTab] = useState('upcoming');

  const groups: Record<string, Booking[]> = {
    upcoming: bookings.filter((b) => b.status === 'upcoming'),
    completed: bookings.filter((b) => b.status === 'completed'),
    cancelled: bookings.filter((b) => b.status === 'cancelled'),
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
                  const I = MODE_ICON[b.mode];
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center"
                    >
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={b.tutorAvatar} alt={b.tutorName} />
                        <AvatarFallback>{getInitials(b.tutorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{b.tutorName}</span>
                          {b.isTrial && <Badge variant="gold">Trial</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{b.subject}</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{format(new Date(b.date), 'EEE, MMM d')}</div>
                        <div className="text-muted-foreground">
                          {b.time} · {b.durationMins} min
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[b.status]} className="gap-1 capitalize">
                        <I className="h-3 w-3" /> {b.status}
                      </Badge>
                      <div className="font-display font-bold">{formatPKR(b.amount)}</div>
                      <div className="flex gap-2">
                        {b.status === 'upcoming' && <Button size="sm" variant="gradient">Join</Button>}
                        {b.status === 'completed' && <Button size="sm" variant="outline">Review</Button>}
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
