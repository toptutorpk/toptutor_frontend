import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function RatingStars({
  value,
  size = 16,
  className,
  showValue = false,
  count,
  interactive = false,
  onChange,
}: RatingStarsProps) {
  // Honest empty state: a tutor with no reviews yet shows "New" rather than a fake 0.0.
  if (!interactive && typeof count === 'number' && count === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
          className,
        )}
      >
        New
      </span>
    );
  }
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex" role={interactive ? 'radiogroup' : 'img'} aria-label={`Rating ${value} of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(value);
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onChange?.(i + 1)}
              className={cn(interactive && 'cursor-pointer transition-transform hover:scale-125', !interactive && 'cursor-default')}
              aria-label={`${i + 1} star`}
            >
              <Star
                style={{ width: size, height: size }}
                className={cn(
                  filled ? 'fill-gold-400 text-gold-400' : 'fill-transparent text-slate-300 dark:text-slate-600',
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && <span className="text-sm font-semibold text-foreground">{value.toFixed(1)}</span>}
      {typeof count === 'number' && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
