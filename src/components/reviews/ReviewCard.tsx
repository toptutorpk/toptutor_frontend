import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, CornerDownRight } from 'lucide-react';
import type { Review } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/common/RatingStars';
import { cn, getInitials } from '@/lib/utils';

/**
 * One review. Helpful is a toggle: pressed when the viewer has voted. Without {@code onHelpful} (or
 * on the viewer's own review) it only shows the count.
 */
export function ReviewCard({
  review,
  helpful = false,
  own = false,
  onHelpful,
}: {
  review: Review;
  helpful?: boolean;
  own?: boolean;
  onHelpful?: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={review.authorAvatar} alt={review.authorName} />
          <AvatarFallback>{getInitials(review.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{review.authorName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
              </p>
            </div>
            <RatingStars value={review.rating} size={14} />
          </div>
          {review.subject && (
            <Badge variant="secondary" className="mt-2">
              {review.subject}
            </Badge>
          )}
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{review.comment}</p>

          {review.tutorResponse && (
            <div className="mt-3 rounded-xl border-l-2 border-brand-400 bg-secondary/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <CornerDownRight className="h-3.5 w-3.5" /> Tutor’s response
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{review.tutorResponse}</p>
            </div>
          )}

          <button
            type="button"
            onClick={onHelpful}
            disabled={!onHelpful || own}
            aria-pressed={helpful}
            title={own ? 'You can’t vote on your own review' : helpful ? 'Remove your vote' : 'Mark as helpful'}
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 -ml-2 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-60',
              helpful
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'text-muted-foreground enabled:hover:text-primary',
            )}
          >
            <ThumbsUp className={cn('h-3.5 w-3.5', helpful && 'fill-current')} /> Helpful (
            {review.helpfulCount ?? 0})
          </button>
        </div>
      </div>
    </div>
  );
}
