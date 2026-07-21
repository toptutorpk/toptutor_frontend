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
import { bookingService } from '@/services/bookingService';
import { useAuthStore } from '@/store/authStore';
import { formatPKR, getInitials } from '@/lib/utils';

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

/** Safe date label — sessionDate is 'YYYY-MM-DD'; guards a missing/invalid value. */
function dateLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'EEE, MMM d');
}

export default function StudentOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: bookings = [] } = useQuery({ queryKey: queryKeys.bookings.all, queryFn: bookingService.list });
  const upcoming = bookings.filter((b) => b.status === 'UPCOMING');
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const spent = bookings.filter((b) => b.paymentStatus === 'PAID').reduce((s, b) => s + (b.amount ?? 0), 0);

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
        <StatCard icon="GraduationCap" label="Completed sessions" value={String(completedCount)} accent="emerald" />
        <StatCard icon="ReceiptText" label="Paid sessions" value={String(bookings.filter((b) => b.paymentStatus === 'PAID').length)} accent="violet" />
        <StatCard icon="Wallet" label="Total spent" value={formatPKR(spent)} accent="amber" />
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
                  const I = MODE_ICON(b.mode);
                  return (
                    <li key={b.id} className="flex items-center gap-4 p-5">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={b.tutorAvatar ?? undefined} alt={b.tutorName} />
                        <AvatarFallback>{getInitials(b.tutorName || 'Tutor')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{b.tutorName || 'Tutor'}</div>
                        <div className="text-sm text-muted-foreground">
                          {b.startTime}–{b.endTime}
                        </div>
                      </div>
                      <div className="hidden text-right text-sm sm:block">
                        <div className="font-medium">{dateLabel(b.sessionDate)}</div>
                        <div className="text-muted-foreground">{b.dayOfWeek?.toLowerCase()}</div>
                      </div>
                      <Badge variant="secondary" className="gap-1 capitalize">
                        <I className="h-3 w-3" /> {b.mode?.toLowerCase() ?? 'online'}
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
