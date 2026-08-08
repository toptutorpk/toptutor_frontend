import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/lib/icons';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  accent?: string;
}

export function StatCard({ icon, label, value, delta, trend = 'up', accent = 'brand' }: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            accent === 'brand' && 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
            accent === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
            accent === 'violet' && 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
            accent === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
          )}
        >
          <DynamicIcon name={icon} className="h-5 w-5" />
        </span>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-semibold',
              trend === 'up'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
            )}
          >
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4 font-display text-2xl font-extrabold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

/** Lightweight bar chart (no external chart lib) for dashboard visuals. */
export function MiniBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all hover:from-brand-700 hover:to-brand-500"
              style={{ height: `${(v / max) * 100}%` }}
              title={String(v)}
            />
          </div>
          <span className="text-xs text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
