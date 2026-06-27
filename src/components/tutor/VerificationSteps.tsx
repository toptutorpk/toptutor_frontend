import { Check, Clock, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationStep } from '@/types';

const STATUS_STYLE: Record<
  VerificationStep['status'],
  { icon: typeof Check; ring: string; bg: string; text: string; label: string }
> = {
  passed: { icon: Check, ring: 'ring-emerald-200', bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'Passed' },
  pending: { icon: Clock, ring: 'ring-blue-200', bg: 'bg-blue-500', text: 'text-blue-600', label: 'In review' },
  failed: { icon: X, ring: 'ring-red-200', bg: 'bg-red-500', text: 'text-red-600', label: 'Failed' },
  optional: { icon: Minus, ring: 'ring-amber-200', bg: 'bg-amber-400', text: 'text-amber-600', label: 'Optional' },
};

export function VerificationSteps({ steps }: { steps: VerificationStep[] }) {
  return (
    <ol className="relative space-y-1">
      {steps.map((step, i) => {
        const s = STATUS_STYLE[step.status];
        const Icon = s.icon;
        const last = i === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-4 pb-5">
            {!last && (
              <span className="absolute left-[15px] top-8 h-full w-0.5 bg-border" aria-hidden />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ring-4 ring-offset-0',
                s.bg,
                s.ring,
                'dark:ring-transparent',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={3} />
            </span>
            <div className="flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold">
                  Step {step.id}: {step.label}
                </h4>
                <span className={cn('text-xs font-semibold', s.text)}>{s.label}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
