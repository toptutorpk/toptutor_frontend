import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { PageHeader, StatCard, MiniBarChart } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VerificationBadge } from '@/components/common/VerificationBadge';
import { formatPKR, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function TutorAnalytics() {
  const user = useAuthStore((s) => s.user);
  const recentStudents = [
    { name: 'Hassan A.', subject: 'Mathematics', sessions: 12 },
    { name: 'Maryam K.', subject: 'Physics', sessions: 8 },
    { name: 'Bilal R.', subject: 'Mathematics', sessions: 5 },
  ];

  return (
    <div>
      <PageHeader
        title={`Salam, ${user?.name?.split(' ')[0] ?? 'Tutor'} 👋`}
        description="Here’s how your tutoring is performing this month."
        action={
          <Button variant="gradient" asChild>
            <Link to="/dashboard/tutor/schedule">
              Manage schedule <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="Wallet" label="This month earnings" value={formatPKR(86400)} delta="+18%" accent="emerald" />
        <StatCard icon="GraduationCap" label="Sessions completed" value="42" delta="+6" accent="brand" />
        <StatCard icon="Star" label="Average rating" value="4.9" accent="amber" />
        <StatCard icon="Users" label="Active students" value="18" delta="+3" accent="violet" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Earnings overview</h2>
            <Badge variant="secondary">Last 7 months</Badge>
          </div>
          <MiniBarChart
            data={[42, 55, 48, 61, 73, 68, 86]}
            labels={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
          />
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg font-bold">Verification</h2>
          <div className="mt-3 flex items-center gap-2">
            <VerificationBadge status="verified" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Profile completeness keeps you ranking higher in search.
          </p>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-sm">
              <span>Profile completeness</span>
              <span className="font-semibold">85%</span>
            </div>
            <Progress value={85} />
          </div>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/dashboard/tutor/verification">Complete profile</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="font-display text-lg font-bold">Your students</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/tutor/students">View all</Link>
          </Button>
        </div>
        <ul className="divide-y">
          {recentStudents.map((s) => (
            <li key={s.name} className="flex items-center gap-4 p-5">
              <Avatar className="h-11 w-11">
                <AvatarFallback>{getInitials(s.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-muted-foreground">{s.subject}</div>
              </div>
              <Badge variant="secondary">{s.sessions} sessions</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> 5.0
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
