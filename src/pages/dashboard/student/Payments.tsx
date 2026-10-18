import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/StateViews';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { bookingService } from '@/services/bookingService';
import { formatPKR } from '@/lib/utils';
import { ReceiptButton } from '@/components/booking/ReceiptButton';

const PAYMENT_BADGE: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
  PAID: { variant: 'success', label: 'Paid' },
  PENDING: { variant: 'warning', label: 'Pending' },
  FAILED: { variant: 'destructive', label: 'Failed' },
  NONE: { variant: 'secondary', label: '—' },
};

/** Safe date label — the session date is 'YYYY-MM-DD'; guards against a missing/invalid value. */
function dateLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'MMM d, yyyy');
}

export default function StudentPayments() {
  const { data: bookings = [] } = useQuery({ queryKey: queryKeys.bookings.all, queryFn: bookingService.list });

  const paid = bookings.filter((b) => b.paymentStatus === 'PAID');
  const totalSpent = paid.reduce((sum, b) => sum + (b.amount ?? 0), 0);

  return (
    <div>
      <PageHeader title="Payments & Receipts" description="Your transactions and downloadable receipts." />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon="Wallet" label="Total spent" value={formatPKR(totalSpent)} accent="brand" />
        <StatCard icon="ReceiptText" label="Paid sessions" value={String(paid.length)} accent="violet" />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4" />
        Every successful payment generates an official receipt you can view or download anytime.
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-soft">
        {bookings.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No payments yet" description="When you pay for a session, it’ll appear here with a receipt." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Tutor</th>
                  <th className="px-5 py-3 font-semibold">Session</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Amount</th>
                  <th className="px-5 py-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => {
                  const badge = PAYMENT_BADGE[b.paymentStatus] ?? PAYMENT_BADGE.NONE;
                  return (
                    <tr key={b.id} className="hover:bg-secondary/30">
                      <td className="px-5 py-3 text-muted-foreground">{dateLabel(b.sessionDate)}</td>
                      <td className="px-5 py-3 font-medium">{b.tutorName || 'Tutor'}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {b.startTime}–{b.endTime}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={badge.variant} className="capitalize">{badge.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-display font-bold">
                        {b.amount != null ? formatPKR(b.amount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ReceiptButton bookingId={b.id} disabled={b.paymentStatus !== 'PAID'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
