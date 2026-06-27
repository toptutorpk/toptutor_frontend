import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Tier {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-3xl border p-7 shadow-soft transition-all',
        tier.highlighted
          ? 'border-brand-500 bg-card shadow-glow lg:scale-105'
          : 'bg-card hover:-translate-y-1 hover:shadow-lg',
      )}
    >
      {tier.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-1 text-xs font-bold text-white shadow-md">
          <Sparkles className="h-3 w-3" /> Most Popular
        </span>
      )}
      <h3 className="font-display text-lg font-bold">{tier.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
      <div className="mt-5 flex items-end gap-1">
        <span className="font-display text-4xl font-extrabold">
          {tier.price === 0 ? 'Free' : formatPKR(tier.price)}
        </span>
        {tier.price > 0 && <span className="mb-1 text-sm text-muted-foreground">/{tier.period}</span>}
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>
      <Button
        className="mt-7"
        size="lg"
        variant={tier.highlighted ? 'gradient' : 'outline'}
        asChild
      >
        <Link to="/signup">{tier.cta}</Link>
      </Button>
    </div>
  );
}
