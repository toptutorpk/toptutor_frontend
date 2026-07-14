import { PageHeader, StatCard, MiniBarChart } from '@/components/dashboard/DashboardKit';
import { Panel } from '@/components/admin/AdminKit';
import { AreaChart, Donut, HBarList } from '@/components/admin/charts';
import {
  MONTHS,
  REGISTRATIONS,
  REVENUE_SERIES,
  ROLE_BREAKDOWN,
  REVENUE_BY_STREAM,
  TOP_SUBJECTS,
} from '@/services/mock/admin';

export default function AdminAnalytics() {
  return (
    <div>
      <PageHeader title="Analytics" description="Growth, revenue and engagement across the platform." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="TrendingUp" label="MoM growth" value="+15%" delta="+2.1%" accent="brand" />
        <StatCard icon="Users" label="Monthly active users" value="10,400" delta="+9%" accent="violet" />
        <StatCard icon="CalendarCheck" label="Sessions / month" value="6,420" delta="+15%" accent="emerald" />
        <StatCard icon="Repeat" label="Retention (3-mo)" value="62%" delta="+4%" accent="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="New tutors" subtitle="Onboarded per month">
          <div className="p-5">
            <AreaChart labels={MONTHS} series={[{ label: 'Tutors', color: '#2563eb', data: REGISTRATIONS.tutors }]} />
          </div>
        </Panel>
        <Panel title="New students" subtitle="Registered per month">
          <div className="p-5">
            <AreaChart labels={MONTHS} series={[{ label: 'Students', color: '#8b5cf6', data: REGISTRATIONS.students }]} />
          </div>
        </Panel>
      </div>

      <Panel title="Monthly revenue" subtitle="PKR thousands · last 12 months" className="mt-6">
        <div className="p-5">
          <AreaChart
            labels={MONTHS}
            series={[{ label: 'Revenue', color: '#10b981', data: REVENUE_SERIES }]}
            format={(v) => `${v}k`}
          />
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="User base" subtitle="By account type">
          <div className="flex flex-1 items-center justify-center p-5">
            <Donut data={ROLE_BREAKDOWN} centerLabel="users" />
          </div>
        </Panel>
        <Panel title="Revenue by stream" subtitle="This month">
          <div className="flex flex-1 flex-col justify-center p-5">
            <HBarList items={REVENUE_BY_STREAM} format={(v) => `PKR ${(v / 1000).toFixed(0)}k`} />
          </div>
        </Panel>
        <Panel title="Top subjects" subtitle="By verified tutors">
          <div className="flex flex-1 flex-col justify-center p-5">
            <HBarList items={TOP_SUBJECTS.map((s) => ({ label: s.name, value: s.tutors, color: '#2563eb' }))} />
          </div>
        </Panel>
      </div>

      <Panel title="Sessions per month" subtitle="Last 7 months" className="mt-6">
        <div className="p-6">
          <MiniBarChart
            data={[3800, 4200, 4600, 5100, 5600, 6000, 6420]}
            labels={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
          />
        </div>
      </Panel>
    </div>
  );
}
