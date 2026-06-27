import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Calendar, Video, Home, Building2 } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/StateViews';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { contentService } from '@/services/contentService';
import { useAuthStore } from '@/store/authStore';
import { formatPKR, getInitials } from '@/lib/utils';
import type { SessionMode } from '@/types';

const MODE_ICON: Record<SessionMode, typeof Video> = { online: Video, home_visit: Home, institute: Building2 };

export default function StudentOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: bookings } = useQuery({ queryKey: queryKeys.bookings.all, queryFn: contentService.bookings });
  const upcoming = bookings?.filter((b) => b.status === 'upcoming') ?? [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
        description="Here’s what’s happening with your learning."
        action={
          <Button variant="gradient" asChild>
            <Link to="/tutors">
              Find a tutor <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="CalendarCheck" label="Upcoming sessions" value={String(upcoming.length)} accent="brand" />
        <StatCard icon="GraduationCap" label="Completed sessions" value="24" delta="+4" accent="emerald" />
        <StatCard icon="Heart" label="Saved tutors" value="6" accent="violet" />
        <StatCard icon="Wallet" label="Spent this month" value={formatPKR(18500)} accent="amber" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-display text-lg font-bold">Upcoming sessions</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/student/bookings">View all</Link>
              </Button>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState icon={Calendar} title="No upcoming sessions" description="Book a verified tutor to get started." />
            ) : (
              <ul className="divide-y">
                {upcoming.map((b) => {
                  const I = MODE_ICON[b.mode];
                  return (
                    <li key={b.id} className="flex items-center gap-4 p-5">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={b.tutorAvatar} alt={b.tutorName} />
                        <AvatarFallback>{getInitials(b.tutorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{b.tutorName}</div>
                        <div className="text-sm text-muted-foreground">{b.subject}</div>
                      </div>
                      <div className="hidden text-right text-sm sm:block">
                        <div className="font-medium">{format(new Date(b.date), 'EEE, MMM d')}</div>
                        <div className="text-muted-foreground">{b.time}</div>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <I className="h-3 w-3" /> {b.mode.replace('_', ' ')}
                      </Badge>
                      <Button size="sm" variant="outline">Join</Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
          <h3 className="font-display text-lg font-bold">Upgrade to Premium</h3>
          <p className="mt-2 text-sm text-white/80">
            Get priority AI matching, top-rated tutors first, and a 5% discount on every session.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {['Unlimited requirements', 'Priority matching', '5% session discount'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> {t}
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="mt-5 w-full bg-white text-brand-700 hover:bg-white/90" asChild>
            <Link to="/pricing">Upgrade for {formatPKR(999)}/mo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
