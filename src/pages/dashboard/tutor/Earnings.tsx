import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Banknote, Clock, Info, Send, ShieldCheck, Wallet } from 'lucide-react';
import { PageHeader, StatCard, MiniBarChart } from '@/components/dashboard/DashboardKit';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/common/StateViews';
import { queryKeys } from '@/api/queryKeys';
import { earningsService, type EarningLine } from '@/services/earningsService';
import { PayoutAccountCard } from '@/components/tutor/PayoutAccountCard';
import { WithdrawCard, WithdrawalHistory } from '@/components/tutor/WithdrawCard';
import { formatPKR, pluralize } from '@/lib/utils';
import { commissionPercent } from '@/lib/commission';
import { TutorCommissionPlans } from '@/components/tutor/TutorCommissionPlans';

export default function TutorEarnings() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.earnings.all,
    queryFn: earningsService.get,
  });

  if (isLoading) return <EarningsSkeleton />;
  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Earnings" description="What you have earned, and when it clears." />
        <ErrorState onRetry={() => refetch()} message="We couldn’t load your earnings." />
      </div>
    );
  }

  const { escrowReleaseHours } = data;

  return (
    <div>
      <PageHeader
        title="Earnings"
        description={`What you have earned. Money clears ${escrowReleaseHours} hours after a session ends.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="Wallet"
          label="Available"
          value={formatPKR(data.available)}
          accent="emerald"
        />
        <StatCard icon="Clock" label="Clearing" value={formatPKR(data.pending)} accent="amber" />
        <StatCard
          icon="TrendingUp"
          label="This month"
          value={formatPKR(data.thisMonth)}
          accent="brand"
        />
        <StatCard
          icon="Banknote"
          label="Lifetime earned"
          value={formatPKR(data.lifetime)}
          accent="violet"
        />
      </div>

      <CommissionNote
        rate={data.commissionRate}
        loyalRate={data.loyalCommissionRate}
        sessionsToGo={data.sessionsToLoyalRate}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="whitespace-nowrap font-display text-lg font-bold">Monthly earnings</h2>
            <span className="text-xs text-muted-foreground">
              What you earned after commission, by session month
            </span>
          </div>
          <MiniBarChart
            data={data.monthly.map((m) => m.net)}
            labels={data.monthly.map((m) => m.label)}
            formatValue={formatPKR}
            emptyText="Your earnings will show here month by month once sessions are paid."
          />
        </div>

        <WithdrawCard
          available={data.available}
          escrowReleaseHours={escrowReleaseHours}
          minWithdrawal={data.minWithdrawal}
        />
      </div>

      <div className="mt-6">
        <PayoutAccountCard />
      </div>

      <WithdrawalHistory />

      <TutorCommissionPlans />
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <h2 className="border-b p-5 font-display text-lg font-bold">Session earnings</h2>
        {data.lines.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No earnings yet"
            description="Once a student books and pays for a session with you, it will appear here with exactly what you earned from it."
          />
        ) : (
          <EarningsTable lines={data.lines} />
        )}
      </div>
    </div>
  );
}

/**
 * The tutor's current commission, and how far off the reduced one is.
 *
 * <p>Says "future sessions" explicitly. The rate on this banner is not the rate the rows below were
 * paid at — each of those carries its own — and a tutor who has just moved onto the lower rate would
 * otherwise read the table as though they had been underpaid.
 */
function CommissionNote({
  rate,
  loyalRate,
  sessionsToGo,
}: {
  rate: number;
  loyalRate: number;
  sessionsToGo: number;
}) {
  const pct = commissionPercent;
  return (
    <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Future sessions are charged at <strong>{pct(rate)}</strong> commission.
        {sessionsToGo > 0 && loyalRate < rate && (
          <>
            {' '}
            Complete {sessionsToGo} more {pluralize(sessionsToGo, 'session')} to drop to{' '}
            <strong>{pct(loyalRate)}</strong> and keep more.
          </>
        )}
      </span>
    </div>
  );
}

function EarningsTable({ lines }: { lines: EarningLine[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-semibold">Session</th>
            <th className="px-5 py-3 font-semibold">Student</th>
            <th className="px-5 py-3 text-right font-semibold">Charged</th>
            <th className="px-5 py-3 text-right font-semibold">Commission</th>
            <th className="px-5 py-3 text-right font-semibold">You earned</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {lines.map((line) => (
            <tr key={line.bookingId} className="hover:bg-secondary/30">
              <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                {format(parseISO(line.sessionDate), 'd MMM yyyy')}
                <span className="ml-1.5 text-xs tabular-nums">
                  {line.startTime}–{line.endTime}
                </span>
              </td>
              <td className="px-5 py-3 font-medium">{line.learnerName}</td>
              <td className="px-5 py-3 text-right tabular-nums">{formatPKR(line.gross)}</td>
              <td className="px-5 py-3 text-right">
                {/* Per row, because it is the rate THIS session was paid at — which is not
                    necessarily the tutor's current rate. */}
                <Badge variant="secondary">{commissionPercent(line.commissionRate)}</Badge>
                <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                  −{formatPKR(line.platformFee)}
                </span>
              </td>
              <td className="px-5 py-3 text-right font-display font-bold tabular-nums text-emerald-600">
                {formatPKR(line.net)}
              </td>
              {/* "Withdrawn" is checked first: a claimed session is no longer available, and
                  labelling it so is what stops the rows adding up to more than the balance above
                  them and reading like money that went missing. */}
              <td className="px-5 py-3">
                {line.claimed ? (
                  <Badge variant="secondary">
                    <Send className="h-3 w-3" /> In a withdrawal
                  </Badge>
                ) : line.released ? (
                  <Badge variant="success">
                    <Wallet className="h-3 w-3" /> Available
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <Clock className="h-3 w-3" /> Clearing
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="flex items-start gap-1.5 border-t p-4 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          The commission shown on each row is the rate that applied when that session was paid, so
          older sessions may differ from your current rate.
        </span>
      </p>
    </div>
  );
}

function EarningsSkeleton() {
  return (
    <div>
      <PageHeader title="Earnings" description="What you have earned, and when it clears." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-12 rounded-xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="mt-6 h-64 rounded-2xl" />
    </div>
  );
}
