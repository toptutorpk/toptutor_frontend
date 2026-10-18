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

export function StatCard({
  icon,
  label,
  value,
  delta,
  trend = 'up',
  accent = 'brand',
}: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            accent === 'brand' &&
              'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
            accent === 'amber' &&
              'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
            accent === 'violet' &&
              'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
            accent === 'emerald' &&
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
            accent === 'rose' && 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
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
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
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
/**
 * A single-series bar chart (one value per period, e.g. earnings per month).
 *
 * <p>Each bar sits in a column of definite height so its percentage height resolves — inside a plain
 * flex item a `height: %` has nothing to measure against and every bar renders at zero. Empty periods
 * keep a thin stub on the baseline so the timeline stays readable; hovering a column shows its exact
 * value, and only the highest bar carries a printed label.
 */
export function MiniBarChart({
  data,
  labels,
  formatValue = (v) => v.toLocaleString(),
  emptyText = 'Nothing yet — bars appear as activity comes in.',
}: {
  data: number[];
  labels: string[];
  formatValue?: (v: number) => string;
  emptyText?: string;
}) {
  const max = Math.max(...data, 0);
  const peak = max > 0 ? data.lastIndexOf(max) : -1;
  return (
    <div className="relative">
      <div
        className="flex h-48 gap-1.5 border-b border-border sm:gap-2"
        role="img"
        aria-label={chartSummary(data, labels, formatValue)}
      >
        {data.map((v, i) => {
          const pct = max > 0 ? (v / max) * 100 : 0;
          return (
            <div key={i} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
              {/* Hover tooltip: the exact figure for this period. */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                <span className="text-muted-foreground">{labels[i]}</span>{' '}
                <span className="font-semibold tabular-nums text-foreground">{formatValue(v)}</span>
              </div>
              {i === peak && (
                <span className="mb-1 truncate text-center text-[11px] font-semibold tabular-nums text-foreground">
                  {formatValue(v)}
                </span>
              )}
              <div
                className={cn(
                  'mx-auto w-full max-w-12 rounded-t transition-colors',
                  v > 0 ? 'bg-brand-500 group-hover:bg-brand-600' : 'bg-border',
                )}
                style={{ height: v > 0 ? `max(${pct}%, 4px)` : '2px' }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {labels.map((l, i) => (
          <span
            key={i}
            className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground"
          >
            {l}
          </span>
        ))}
      </div>
      {max === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-16 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function chartSummary(data: number[], labels: string[], format: (v: number) => string) {
  return data.map((v, i) => `${labels[i]}: ${format(v)}`).join(', ');
}
