import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { Panel, PersonCell } from '@/components/admin/AdminKit';
import { AreaChart, Donut, HBarList } from '@/components/admin/charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { adminService } from '@/services/adminService';
import {
  SECONDARY_KPIS,
  MONTHS,
  REGISTRATIONS,
  REVENUE_SERIES,
  ROLE_BREAKDOWN,
  REVENUE_BY_STREAM,
  RECENT_ACTIVITY,
} from '@/services/mock/admin';

const ACCENT: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

export default function AdminOverview() {
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => adminService.stats() });
  const tutors = useQuery({ queryKey: ['admin', 'tutors'], queryFn: () => adminService.tutors() });

  const s = stats.data;
  const n = (v?: number) => (v == null ? '—' : v.toLocaleString());
  const totalReg = MONTHS.map((_, i) => REGISTRATIONS.tutors[i] + REGISTRATIONS.students[i]);
  const pending = (tutors.data ?? []).filter(
    (t) => t.verification === 'under_review' || t.verification === 'partial',
  );

  const decide = async (id: number, decision: 'APPROVE' | 'REJECT') => {
    try {
      await adminService.decide(id, decision);
      await qc.invalidateQueries({ queryKey: ['admin', 'tutors'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast[decision === 'APPROVE' ? 'success' : 'error'](
        decision === 'APPROVE' ? 'Tutor approved & listed' : 'Application rejected',
      );
    } catch {
      toast.error('Could not record decision');
    }
  };

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="A live pulse of TopTutor — registrations, verification, revenue and activity."
        action={
          <Button variant="gradient" asChild>
            <Link to="/admin/approvals">
              Review approvals <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* Real KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="GraduationCap" label="Total tutors" value={n(s?.totalTutors)} accent="brand" />
        <StatCard icon="ShieldCheck" label="Verified tutors" value={n(s?.verifiedTutors)} accent="emerald" />
        <StatCard icon="ShieldAlert" label="Pending approvals" value={n(s?.pendingApprovals)} accent="amber" />
        <StatCard icon="UserCheck" label="Active tutors" value={n(s?.activeTutors)} accent="violet" />
      </div>
      {/* Demo metrics (not yet backed by real data) */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECONDARY_KPIS.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Total registrations" subtitle="Demo trend · last 12 months">
          <div className="p-5">
            <AreaChart labels={MONTHS} series={[{ label: 'Registrations', color: '#2563eb', data: totalReg }]} />
          </div>
        </Panel>
        <Panel title="User base" subtitle="Demo · by account type">
          <div className="flex flex-1 items-center justify-center p-5">
            <Donut data={ROLE_BREAKDOWN} centerLabel="users" />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Monthly revenue" subtitle="Demo · PKR thousands">
          <div className="p-5">
            <AreaChart labels={MONTHS} series={[{ label: 'Revenue', color: '#10b981', data: REVENUE_SERIES }]} format={(v) => `${v}k`} />
          </div>
        </Panel>
        <Panel title="Revenue by stream" subtitle="Demo · this month">
          <div className="flex flex-1 flex-col justify-center p-5">
            <HBarList items={REVENUE_BY_STREAM} format={(v) => `PKR ${(v / 1000).toFixed(0)}k`} />
          </div>
        </Panel>
      </div>

      {/* Real approval queue */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Pending tutor approvals"
          subtitle={`${pending.length} tutors awaiting your review`}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/approvals">View all</Link>
            </Button>
          }
        >
          {pending.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nothing pending right now. 🎉</p>
          ) : (
            <ul className="divide-y">
              {pending.slice(0, 5).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <PersonCell name={t.name} sub={`${t.city ?? '—'} · ${t.email}`} />
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {t.stepsPassed}/{t.stepsTotal} steps
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => decide(t.id, 'REJECT')}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                    <Button size="sm" variant="gradient" onClick={() => decide(t.id, 'APPROVE')}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" subtitle="Demo">
          <ul className="space-y-1 p-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-secondary/40">
                <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', ACCENT[a.accent])}>
                  <DynamicIcon name={a.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
