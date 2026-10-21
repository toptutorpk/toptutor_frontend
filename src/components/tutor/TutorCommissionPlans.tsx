import { useQuery } from '@tanstack/react-query';
import { Crown } from 'lucide-react';
import { tutorCommissionService } from '@/services/tutorCommissionService';
import { commissionPercent } from '@/lib/commission';
import { formatPKR } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function TutorCommissionPlans() {
  const query = useQuery({
    queryKey: ['tutor', 'commission'],
    queryFn: tutorCommissionService.mine,
  });
  const view = query.data;
  if (!view)
    return query.isError ? (
      <p className="mt-4 text-sm text-muted-foreground">
        Could not load subscription details.{' '}
        <button className="text-primary underline" onClick={() => void query.refetch()}>
          Retry
        </button>
      </p>
    ) : null;
  return (
    <section className="mt-5 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Crown className="h-4 w-4 text-amber-600" />
          Commission Plus
        </h2>
        <Badge variant={view.subscriptionStatus === 'ACTIVE' ? 'success' : 'secondary'}>
          {view.subscriptionStatus === 'NONE'
            ? 'Not subscribed'
            : view.subscriptionStatus.toLowerCase()}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Your current effective platform commission is{' '}
        <strong className="text-foreground">{commissionPercent(view.effectiveRate)}</strong>.
        Loyalty progress continues while subscribed.
      </p>
      {view.subscription && (
        <p className="mt-2 text-sm">
          {view.subscription.planName} · {commissionPercent(view.subscription.discountRate)}{' '}
          commission reduction · Paid through{' '}
          {new Date(view.subscription.endsAt).toLocaleDateString('en-PK', {
            timeZone: 'Asia/Karachi',
          })}
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {view.plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold">{plan.name}</h3>
            <p className="mt-1 text-lg font-bold">
              {formatPKR(plan.price)}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                / {plan.durationMonths === 1 ? 'month' : `${plan.durationMonths} months`}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {commissionPercent(plan.commissionDiscountRate)} off your applicable platform
              commission
            </p>
          </div>
        ))}
      </div>
      {!view.checkoutAvailable && (
        <p className="mt-3 text-xs text-muted-foreground">Plan purchases are not available yet.</p>
      )}
    </section>
  );
}
