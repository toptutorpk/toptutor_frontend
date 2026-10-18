import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { CornerDownRight, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardListCard } from '@/components/tutor/DashboardListCard';
import { reviewService, type TutorReview } from '@/services/reviewService';
import { cn, getInitials } from '@/lib/utils';

const SHOWN = 3;

/**
 * What students have said lately.
 *
 * <p>Sits opposite the sessions card so the row reads as "what is coming / how it went". Reviews
 * without a reply are called out, because replying is the one thing on this card the tutor can act
 * on, and an unanswered review is visible on their public profile.
 */
export function RecentReviewsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', 'received'],
    queryFn: reviewService.received,
  });

  const reviews = (data ?? [])
    // Newest first: the endpoint makes no promise about order, and a stale review at the top would
    // make the card look abandoned.
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const unanswered = reviews.filter((r) => !r.tutorResponse).length;

  return (
    <DashboardListCard
      title="Recent reviews"
      icon={Star}
      to="/dashboard/tutor/reviews"
      linkLabel="All reviews"
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2">
          {unanswered > 0 && (
            <p className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
              {unanswered === 1
                ? '1 review is waiting for your reply'
                : `${unanswered} reviews are waiting for your reply`}
            </p>
          )}
          <ul className="space-y-2">
            {reviews.slice(0, SHOWN).map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </ul>
        </div>
      )}
    </DashboardListCard>
  );
}

function ReviewRow({ review }: { review: TutorReview }) {
  return (
    <li className="rounded-xl border bg-secondary/20 p-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          {review.studentAvatar && <AvatarImage src={review.studentAvatar} alt="" />}
          <AvatarFallback className="text-xs">{getInitials(review.studentName)}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{review.studentName}</p>
        <Stars rating={review.rating} />
      </div>
      {review.comment && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          “{review.comment}”
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {formatDistanceToNow(parseISO(review.date), { addSuffix: true })}
        {!review.tutorResponse && ' · not replied to'}
      </p>
    </li>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </span>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <Star className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">No reviews yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Students can review you once a session is finished.
      </p>
      <Button variant="outline" size="sm" className="mt-3" asChild>
        <Link to="/dashboard/tutor/sessions">View sessions</Link>
      </Button>
    </div>
  );
}
