import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { PageHeader, StatCard, MiniBarChart } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/StateViews';
import { VerificationProgressCard } from '@/components/tutor/VerificationProgressCard';
import { UpcomingSessionsCard } from '@/components/tutor/UpcomingSessionsCard';
import { RecentReviewsCard } from '@/components/tutor/RecentReviewsCard';
import { queryKeys } from '@/api/queryKeys';
import { earningsService } from '@/services/earningsService';
import { formatPKR } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function TutorAnalytics() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.tutorAnalytics.all,
    queryFn: earningsService.analytics,
  });

  const greeting = `Salam, ${user?.name?.split(' ')[0] ?? 'Tutor'} 👋`;

  if (isLoading) return <AnalyticsSkeleton greeting={greeting} />;
  if (isError || !data) {
    return (
      <div>
        <PageHeader title={greeting} description="How your tutoring is going." />
        <ErrorState onRetry={() => refetch()} message="We couldn’t load your dashboard." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={greeting}
        description="How your tutoring is going."
        action={
          <Button variant="gradient" asChild>
            <Link to="/dashboard/tutor/schedule">
              Manage schedule <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="Wallet"
          label="This month earnings"
          value={formatPKR(data.thisMonthEarnings)}
          accent="emerald"
        />
        <StatCard
          icon="GraduationCap"
          label="Sessions taught"
          value={String(data.completedSessions)}
          accent="brand"
        />
        {/* An unrated tutor gets an em dash, not 0.0 — a new tutor has no rating, which is a
            different thing from everyone having disliked them. */}
        <StatCard
          icon="Star"
          label={data.ratingCount > 0 ? `Rating · ${data.ratingCount} reviews` : 'Average rating'}
          value={data.averageRating != null ? data.averageRating.toFixed(1) : '—'}
          accent="amber"
        />
        <StatCard
          icon="Users"
          label="Students taught"
          value={String(data.activeStudents)}
          accent="violet"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Earnings overview</h2>
            <Badge variant="secondary">Last {data.monthly.length} months</Badge>
          </div>
          <MiniBarChart
            data={data.monthly.map((m) => m.net)}
            labels={data.monthly.map((m) => m.label)}
          />
        </div>

        <VerificationProgressCard
          verifiedSteps={data.verifiedSteps}
          totalSteps={data.totalSteps}
        />
      </div>

      {/* What is coming, and how it went. Both read endpoints that already exist, so nothing here
          is invented — the fabricated "Your students" list that used to fill this space was removed
          rather than kept, and each card carries its own honest empty state. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <UpcomingSessionsCard />
        <RecentReviewsCard />
      </div>
    </div>
  );
}

function AnalyticsSkeleton({ greeting }: { greeting: string }) {
  return (
    <div>
      <PageHeader title={greeting} description="How your tutoring is going." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      {/* Matches the real row's height, so the page does not jump when the data lands. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
