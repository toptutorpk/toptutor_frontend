import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, Receipt, TrendingUp, X } from 'lucide-react';
import {
  hiringService,
  type Billing,
  type PlanTierKey,
} from '@/services/instituteService';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { toast } from '@/components/ui/sonner';
import { formatPKR, cn } from '@/lib/utils';

/**
 * Headline price, and the one number every other figure on this page is derived from.
 *
 * <p>Nothing below hardcodes a saving, an effective monthly rate or a percentage. Those are
 * computed, so a price change here cannot leave the page advertising a discount it no longer
 * gives — which is the sort of mistake that is both embarrassing and arguably a misrepresentation.
 */
const MONTHLY_PRICE = 1999;

/** Six months up front. Priced to land on a round Rs 1,500 a month, which is the pitch. */
const SIX_MONTH_PRICE = 8999;

const SIX_MONTH_FULL = MONTHLY_PRICE * 6;
const SIX_MONTH_SAVING = SIX_MONTH_FULL - SIX_MONTH_PRICE;
const SIX_MONTH_SAVING_PCT = Math.round((SIX_MONTH_SAVING / SIX_MONTH_FULL) * 100);
const SIX_MONTH_EFFECTIVE = Math.round(SIX_MONTH_PRICE / 6);

type BillingPeriod = 'MONTHLY' | 'SIX_MONTH';

/**
 * The plans, described for the person choosing one.
 *
 * <p>Sales copy, not the rule: the server's `PlanTier` stays the authority on what is actually
 * enforced. Where the two disagree the server wins and this page is the bug.
 *
 * <p>`included` and `excluded` are separate lists rather than one list of ticks. On a free tier
 * the absence of direct offers is the single most important fact — it is the reason to upgrade —
 * and a feature list that only shows what you *do* get hides it.
 */
const PLANS: {
  key: PlanTierKey;
  label: string;
  blurb: string;
  included: string[];
  excluded: string[];
  highlight?: boolean;
}[] = [
  {
    key: 'LISTED',
    label: 'Free',
    blurb: 'Enough to hire once and see what the database holds.',
    included: [
      'One job post a month',
      'Applications from verified teachers',
      'Anonymised teacher search',
      'Digital contracts and payroll',
    ],
    excluded: ['Direct offers to a teacher', 'Full teacher profiles before they apply'],
  },
  {
    key: 'GROWTH',
    label: 'Pro',
    blurb: 'For a school hiring more than once a term.',
    included: [
      'Unlimited job posts',
      'Approach any teacher directly',
      'Full profiles before they apply',
      'Priority in the teacher job feed',
      'Digital contracts and payroll',
    ],
    excluded: [],
    highlight: true,
  },
];

export default function InstituteBilling() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<BillingPeriod>('SIX_MONTH');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['institute', 'billing'],
    queryFn: () => hiringService.billing(),
  });

  const change = useMutation({
    // TODO(backend): changeTier takes only a tier, so the chosen billing period is not yet sent.
    // Switching to Pro bills monthly whatever the toggle says until the API accepts a period.
    // The server also needs the free tier's job-post cap to become "one per calendar month"
    // rather than "one active at a time", and its direct-offer allowance to be zero.
    mutationFn: (tier: PlanTierKey) => hiringService.changeTier(tier),
    onSuccess: (b) => {
      toast.success(`You're on the ${b.tierLabel} plan`, {
        description: b.monthlyPrice > 0 ? 'Your invoice is below.' : undefined,
      });
      qc.invalidateQueries({ queryKey: ['institute', 'billing'] });
    },
    onError: (e) =>
      toast.error('Could not change plan', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  if (isLoading) return <LoadingState label="Loading billing…" />;
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} message="Could not load billing." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Your plan, what it allows, and what you owe.
        </p>
      </div>

      <CurrentPlan billing={data} />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-bold">Plans</h2>
          <PeriodToggle period={period} onChange={setPeriod} />
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              period={period}
              current={plan.key === data.tier}
              pending={change.isPending}
              onChoose={() => change.mutate(plan.key)}
            />
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Placement fee is charged only when a teacher you hired actually starts — currently{' '}
          {Math.round(data.placementFeeRate * 100)}% of their first month. No hire, no fee.
        </p>
      </section>

      <Invoices billing={data} />
    </div>
  );
}

/** Monthly or six months, with the saving stated on the control that offers it. */
function PeriodToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border bg-secondary/40 p-1">
      {([
        { key: 'MONTHLY' as const, label: 'Monthly' },
        { key: 'SIX_MONTH' as const, label: '6 months' },
      ]).map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          aria-pressed={period === opt.key}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            period === opt.key
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
          {opt.key === 'SIX_MONTH' && (
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              −{SIX_MONTH_SAVING_PCT}%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  period,
  current,
  pending,
  onChoose,
}: {
  plan: (typeof PLANS)[number];
  period: BillingPeriod;
  current: boolean;
  pending: boolean;
  onChoose: () => void;
}) {
  const free = plan.key === 'LISTED';
  const sixMonth = period === 'SIX_MONTH';

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-card p-5 shadow-soft',
        plan.highlight && !current && 'border-brand-500/60 shadow-glow',
        current && 'border-brand-500 ring-1 ring-brand-500',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{plan.label}</h3>
        {current ? (
          <Badge variant="success">Current</Badge>
        ) : (
          plan.highlight && <Badge variant="gold">Recommended</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>

      {free ? (
        <p className="mt-3 font-display text-3xl font-extrabold">
          Free
          <span className="ml-1 align-middle text-sm font-normal text-muted-foreground">
            always
          </span>
        </p>
      ) : (
        <div className="mt-3">
          <p className="font-display text-3xl font-extrabold tabular-nums">
            {formatPKR(sixMonth ? SIX_MONTH_EFFECTIVE : MONTHLY_PRICE)}
            <span className="ml-1 align-middle text-sm font-normal text-muted-foreground">
              /month
            </span>
          </p>
          {sixMonth ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPKR(SIX_MONTH_PRICE)} billed every 6 months ·{' '}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                save {formatPKR(SIX_MONTH_SAVING)}
              </span>{' '}
              <s className="opacity-60">{formatPKR(SIX_MONTH_FULL)}</s>
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Billed monthly, cancel any time ·{' '}
              <span className="font-medium">
                {formatPKR(SIX_MONTH_EFFECTIVE)} on the 6-month plan
              </span>
            </p>
          )}
        </div>
      )}

      <ul className="mt-4 space-y-1.5 text-sm">
        {plan.included.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
        {plan.excluded.map((f) => (
          <li key={f} className="flex items-start gap-2 text-muted-foreground">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <Button
          variant={current ? 'outline' : plan.highlight ? 'gradient' : 'outline'}
          className="w-full"
          disabled={current || pending}
          onClick={onChoose}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {current ? 'Current plan' : free ? 'Switch to Free' : 'Upgrade to Pro'}
        </Button>
      </div>
    </div>
  );
}

function CurrentPlan({ billing: b }: { billing: Billing }) {
  // monthlyOffers === 0 is the free tier's defining limit, and "0 of 0" reads like a bug rather
  // than a rule — so it is stated as the rule.
  const noOffers = b.monthlyOffers === 0;
  const quota = b.monthlyOffers == null ? null : `${b.offersUsed} of ${b.monthlyOffers}`;

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <Stat
        icon={TrendingUp}
        label="Current plan"
        value={b.tierLabel}
        sub={b.renewsOn ? `Renews ${new Date(b.renewsOn).toLocaleDateString()}` : 'No renewal'}
      />
      <Stat
        icon={Check}
        label="Direct offers this month"
        value={noOffers ? 'Not included' : (quota ?? `${b.offersUsed} sent`)}
        sub={
          noOffers
            ? 'Upgrade to approach teachers directly'
            : quota
              ? 'Resets at the start of each month'
              : 'Unlimited on this plan'
        }
      />
      <Stat
        icon={Receipt}
        label="Outstanding"
        value={formatPKR(b.outstanding)}
        sub={`Placement fee ${Math.round(b.placementFeeRate * 100)}% of first month`}
      />
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Receipt;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="mt-1.5 font-display text-xl font-extrabold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Invoices({ billing: b }: { billing: Billing }) {
  if (b.invoices.length === 0) {
    return (
      <section>
        <h2 className="font-display font-bold">Invoices</h2>
        <div className="mt-3 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          Nothing charged yet. Plan changes and confirmed placements appear here.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display font-bold">Invoices</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Issued</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {b.invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  {inv.description}
                  <span className="ml-2 text-xs text-muted-foreground">{inv.kind}</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {new Date(inv.issuedOn).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {inv.dueOn ? new Date(inv.dueOn).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatPKR(inv.amount)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'DUE' ? 'gold' : 'secondary'}>
                    {inv.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Online payment isn't wired up yet — invoices stay <strong>DUE</strong> and are settled with
        our team.
      </p>
    </section>
  );
}
