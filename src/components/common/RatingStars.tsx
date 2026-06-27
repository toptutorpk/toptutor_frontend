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
