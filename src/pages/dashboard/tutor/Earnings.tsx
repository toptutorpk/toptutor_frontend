import { format } from 'date-fns';
import { Download, ShieldCheck, Banknote } from 'lucide-react';
import { PageHeader, StatCard, MiniBarChart } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/utils';

const PAYOUTS = [
  { id: 'p1', date: new Date(Date.now() - 2 * 86400000), student: 'Hassan A.', subject: 'Mathematics', gross: 2500, commission: 0.2 },
  { id: 'p2', date: new Date(Date.now() - 4 * 86400000), student: 'Maryam K.', subject: 'Physics', gross: 3000, commission: 0.2 },
  { id: 'p3', date: new Date(Date.now() - 7 * 86400000), student: 'Bilal R.', subject: 'Mathematics', gross: 2500, commission: 0.17 },
  { id: 'p4', date: new Date(Date.now() - 9 * 86400000), student: 'Sana M.', subject: 'Chemistry', gross: 2200, commission: 0.17 },
];

export default function TutorEarnings() {
  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Track your payouts — released within 48 hours of each session."
        action={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Export report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="Wallet" label="Available balance" value={formatPKR(24600)} accent="emerald" />
        <StatCard icon="Clock" label="Pending (escrow)" value={formatPKR(8200)} accent="amber" />
        <StatCard icon="TrendingUp" label="This month" value={formatPKR(86400)} delta="+18%" accent="brand" />
        <StatCard icon="Banknote" label="Lifetime earned" value={formatPKR(742000)} accent="violet" />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4" />
        Your commission is currently <strong>20%</strong>. Complete 51+ sessions to drop to 17% and keep more.
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Monthly earnings</h2>
          <MiniBarChart data={[42, 55, 48, 61, 73, 68, 86]} labels={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} />
        </div>
        <div className="flex flex-col justify-between rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
          <div>
            <Banknote className="h-8 w-8" />
            <h3 className="mt-3 font-display text-lg font-bold">Withdraw earnings</h3>
            <p className="mt-1 text-sm text-white/80">
              Cash out to JazzCash, Easypaisa or your bank account.
            </p>
          </div>
          <Button variant="secondary" className="mt-5 w-full bg-white text-brand-700 hover:bg-white/90">
            Withdraw {formatPKR(24600)}
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <h2 className="border-b p-5 font-display text-lg font-bold">Recent payouts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold text-right">Gross</th>
                <th className="px-5 py-3 font-semibold text-right">Commission</th>
                <th className="px-5 py-3 font-semibold text-right">You earned</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PAYOUTS.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 text-muted-foreground">{format(p.date, 'MMM d')}</td>
                  <td className="px-5 py-3 font-medium">{p.student}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.subject}</td>
                  <td className="px-5 py-3 text-right">{formatPKR(p.gross)}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    <Badge variant="secondary">{Math.round(p.commission * 100)}%</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-display font-bold text-emerald-600">
                    {formatPKR(Math.round(p.gross * (1 - p.commission)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
