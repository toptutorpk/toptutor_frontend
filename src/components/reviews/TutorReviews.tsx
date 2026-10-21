import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  reviewService,
  type PublicReview,
  type PublicReviews,
  type PublicReviewSort,
} from '@/services/reviewService';
import { RatingStars } from '@/components/common/RatingStars';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { ReviewCard } from './ReviewCard';

/** Fills the 2×2 grid exactly. */
const PAGE_SIZE = 4;

const SORTS: { value: PublicReviewSort; label: string }[] = [
  { value: 'NEWEST', label: 'Newest' },
  { value: 'HIGHEST', label: 'Highest rated' },
  { value: 'LOWEST', label: 'Lowest rated' },
  { value: 'HELPFUL', label: 'Most helpful' },
];

/**
 * A tutor's reviews on their public profile: the rating summary, then the reviews four at a time.
 *
 * <p>Every page is a fresh request with the star filter and the order applied by the database, so
 * a tutor with hundreds of reviews never sends them all at once. Changing the filter or the order
 * goes back to page one. The previous page stays on screen while the next one loads, so the layout
 * doesn't jump. The summary (average, bars, total) always covers all reviews whatever the filter.
 */
export function TutorReviews({
  tutorId,
  firstName,
  rating,
  reviewCount,
}: {
  tutorId: number;
  firstName: string;
  rating: number;
  reviewCount: number;
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<PublicReviewSort>('NEWEST');
  const [stars, setStars] = useState<number | null>(null);
  const listTop = useRef<HTMLDivElement>(null);

  const queryKey = ['reviews', 'public', tutorId, { page, sort, stars }];
  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      reviewService.publicForTutor(tutorId, {
        page,
        size: PAGE_SIZE,
        sort,
        rating: stars ?? undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Helpful votes: the count and pressed state change at once, then settle to the server's answer.
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const patchReview = (id: number, patch: Partial<PublicReview>) =>
    qc.setQueryData<PublicReviews>(queryKey, (old) =>
      old ? { ...old, reviews: old.reviews.map((r) => (r.id === id ? { ...r, ...patch } : r)) } : old,
    );
  const helpfulVote = useMutation({
    mutationFn: ({ id, helpful }: { id: number; helpful: boolean }) => reviewService.setHelpful(id, helpful),
    onMutate: ({ id, helpful }) => {
      const before = data?.reviews.find((r) => r.id === id);
      if (before) patchReview(id, { helpful, helpfulCount: before.helpfulCount + (helpful ? 1 : -1) });
      return before;
    },
    onSuccess: (res, { id }) => patchReview(id, { helpful: res.helpful, helpfulCount: res.helpfulCount }),
    onError: (e: unknown, { id }, before) => {
      if (before) patchReview(id, { helpful: before.helpful, helpfulCount: before.helpfulCount });
      toast.error('Couldn’t save your vote', { description: (e as Error).message });
    },
  });
  const voteHelpful = (id: number, helpful: boolean) => {
    if (!signedIn) {
      toast('Sign in to mark reviews as helpful', {
        action: { label: 'Sign in', onClick: () => navigate('/login') },
      });
      return;
    }
    if (!helpfulVote.isPending) helpfulVote.mutate({ id, helpful });
  };

  const counts = data?.ratingCounts ?? {};
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  const filterBy = (next: number | null) => {
    setStars((cur) => (cur === next ? null : next));
    setPage(0);
  };
  const goTo = (next: number) => {
    setPage(next);
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      {/* Summary — always over every review. Clicking a bar filters to that star level. */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
        <div className="text-center">
          <div className="font-display text-5xl font-extrabold text-gradient">{rating.toFixed(1)}</div>
          <RatingStars value={rating} size={16} className="mt-1 justify-center" />
          <div className="mt-1 text-xs text-muted-foreground">
            {reviewCount} review{reviewCount === 1 ? '' : 's'}
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-20 sm:block" />
        <div className="w-full flex-1 space-y-0.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = counts[String(star)] ?? 0;
            const pct = allCount > 0 ? Math.round((count / allCount) * 100) : 0;
            const active = stars === star;
            return (
              <button
                key={star}
                type="button"
                disabled={count === 0}
                onClick={() => filterBy(star)}
                aria-pressed={active}
                title={count === 0 ? undefined : `Show ${star}-star reviews`}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors',
                  count > 0 && 'hover:bg-secondary/70',
                  active && 'bg-secondary',
                  count === 0 && 'cursor-default',
                )}
              >
                <span className={cn('w-3 text-muted-foreground', active && 'font-semibold text-foreground')}>
                  {star}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-[3px] bg-secondary">
                  <span
                    className="block h-full rounded-[3px] bg-gold-400 transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter + order */}
      <div ref={listTop} className="flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by rating">
          <Chip active={stars === null} onClick={() => filterBy(null)}>
            All <span className="tabular-nums opacity-70">{allCount}</span>
          </Chip>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = counts[String(star)] ?? 0;
            return (
              <Chip key={star} active={stars === star} disabled={count === 0} onClick={() => filterBy(star)}>
                {star}
                <Star className="h-3 w-3 fill-current" />
                <span className="tabular-nums opacity-70">{count}</span>
              </Chip>
            );
          })}
        </div>
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as PublicReviewSort);
            setPage(0);
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Sort reviews">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* The page of reviews */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No {stars}-star reviews for {firstName} yet.{' '}
          <button type="button" className="font-semibold text-brand-600 hover:underline" onClick={() => filterBy(null)}>
            Show all reviews
          </button>
        </div>
      ) : (
        <div className={cn('grid gap-4 transition-opacity sm:grid-cols-2', isFetching && 'opacity-60')}>
          {(data?.reviews ?? []).map((r) => (
            <ReviewCard
              key={r.id}
              review={{
                id: String(r.id),
                tutorId: String(tutorId),
                authorName: r.authorName,
                authorAvatar: r.authorAvatar ?? undefined,
                rating: r.rating,
                comment: r.comment ?? '',
                date: r.date,
                tutorResponse: r.tutorResponse ?? undefined,
                helpfulCount: r.helpfulCount,
              }}
              helpful={r.helpful}
              own={r.own}
              onHelpful={() => voteHelpful(r.id, !r.helpful)}
            />
          ))}
        </div>
      )}

      {/* Pager — only when there is more than one page */}
      {total > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground tabular-nums">{from}–{to}</span> of{' '}
            <span className="font-medium text-foreground tabular-nums">{total}</span>
            {stars ? ` ${stars}-star` : ''} reviews
          </p>
          <nav className="flex items-center gap-1" aria-label="Review pages">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isFetching}
              onClick={() => goTo(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {pageList(page, pages).map((p, i) =>
              p === null ? (
                <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'ghost'}
                  size="sm"
                  className="hidden w-9 px-0 tabular-nums sm:inline-flex"
                  aria-current={p === page ? 'page' : undefined}
                  disabled={isFetching && p !== page}
                  onClick={() => p !== page && goTo(p)}
                >
                  {p + 1}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages - 1 || isFetching}
              onClick={() => goTo(page + 1)}
              aria-label="Next page"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors',
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
          : 'bg-card hover:bg-secondary/70',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-card',
      )}
    >
      {children}
    </button>
  );
}

/** Page numbers to show: first, last, and the current one with its neighbours; null marks a gap. */
function pageList(current: number, count: number): (number | null)[] {
  const keep = new Set([0, count - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < count));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}
