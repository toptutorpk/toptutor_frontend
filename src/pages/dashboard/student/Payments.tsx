import { format } from 'date-fns';
import { Download, ShieldCheck } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { contentService } from '@/services/contentService';
import { formatPKR } from '@/lib/utils';

export default function StudentPayments() {
  const { data: bookings = [] } = useQuery({ queryKey: queryKeys.bookings.all, queryFn: contentService.bookings });

  return (
    <div>
      <PageHeader title="Payments & Invoices" description="Your transactions, receipts and escrow status." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon="Wallet" label="Total spent" value={formatPKR(48200)} accent="brand" />
        <StatCard icon="Lock" label="Held in escrow" value={formatPKR(5800)} accent="amber" />
        <StatCard icon="ReceiptText" label="Invoices" value="12" accent="violet" />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4" />
        Your payments are protected by escrow — money is only released after you confirm a session.
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Tutor</th>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                <th className="px-5 py-3 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 text-muted-foreground">{format(new Date(b.date), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3 font-medium">{b.tutorName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{b.subject}</td>
                  <td className="px-5 py-3">
                    <Badge variant={b.status === 'completed' ? 'success' : 'info'} className="capitalize">
                      {b.status === 'completed' ? 'Paid' : 'In escrow'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-display font-bold">{formatPKR(b.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="icon" aria-label="Download receipt">
                      <Download className="h-4 w-4" />
                    </Button>
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
