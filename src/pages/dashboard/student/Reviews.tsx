import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CornerDownRight, X } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RatingStars } from '@/components/common/RatingStars';
import { EmptyState } from '@/components/common/StateViews';
import { cn, getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, type PendingReview, type StudentReview } from '@/services/reviewService';
import { queryKeys } from '@/api/queryKeys';

// Skipped prompts are remembered locally so we never nag — the session stays reviewable elsewhere.
const SKIP_KEY = 'toptutor.reviews.skipped';
const readSkipped = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(SKIP_KEY) ?? '[]');
  } catch {
    return [];
  }
};

/** A single "give a review" prompt for a completed session. Encourages, but easy to skip. */
function PendingCard({ p, onDone, onSkip }: { p: PendingReview; onDone: () => void; onSkip: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const qc = useQueryClient();
  const submit = useMutation({
    mutationFn: () => reviewService.create(p.bookingId, rating, text.trim() || undefined),
    onSuccess: () => {
      toast.success('Review submitted', { description: 'Thanks for helping other students!' });
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all }); // hides the booking's Review button
      onDone();
    },
    onError: (e: unknown) => toast.error('Could not submit review', { description: (e as Error).message }),
  });

  return (
    <div className="relative rounded-2xl border bg-card p-6 shadow-soft">
      <button
        onClick={onSkip}
        className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        title="Skip for now"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={p.tutorAvatar ?? undefined} alt={p.tutorName} />
          <AvatarFallback>{getInitials(p.tutorName || 'Tutor')}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">How was your session with {p.tutorName || 'your tutor'}?</div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(`${p.sessionDate}T00:00:00`), 'EEE, MMM d')} · {p.startTime}–{p.endTime}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Your feedback helps other students choose the right tutor. It only takes a moment — or skip if you’d rather not.
      </p>
      <div className="mt-3">
        <RatingStars value={rating} interactive onChange={setRating} size={28} />
      </div>
      <Textarea
        className="mt-3"
        placeholder="What did you like about the session? (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <Button variant="gradient" disabled={submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? 'Submitting…' : 'Submit Review'}
        </Button>
        <Button variant="ghost" onClick={onSkip}>Skip</Button>
      </div>
    </div>
  );
}

/** A review the student already wrote (with the tutor's reply, if any). */
function MyReviewCard({ r }: { r: StudentReview }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={r.tutorAvatar ?? undefined} alt={r.tutorName} />
          <AvatarFallback>{getInitials(r.tutorName || 'Tutor')}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{r.tutorName || 'Tutor'}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(r.date), 'MMM d, yyyy')}</p>
            </div>
            <RatingStars value={r.rating} size={14} />
          </div>
          {r.comment && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.comment}</p>}
          {r.tutorResponse && (
            <div className="mt-3 rounded-xl border-l-2 border-brand-400 bg-secondary/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <CornerDownRight className="h-3.5 w-3.5" /> {r.tutorName?.split(' ')[0] || 'Tutor'}’s response
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{r.tutorResponse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentReviews() {
  // Arriving from a booking's Review button: that session is shown even if it was skipped before.
  const [params] = useSearchParams();
  const target = Number(params.get('booking')) || null;
  const [skipped, setSkipped] = useState<number[]>(() => readSkipped().filter((id) => id !== target));
  const { data: pending = [] } = useQuery({ queryKey: ['reviews', 'pending'], queryFn: reviewService.pending });
  const { data: mine = [] } = useQuery({ queryKey: ['reviews', 'mine'], queryFn: reviewService.mine });

  const targetRef = useRef<HTMLDivElement>(null);
  const targetPending = target !== null && pending.some((p) => p.bookingId === target);
  useEffect(() => {
    if (targetPending) targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [targetPending]);

  const skip = (bookingId: number) => {
    const next = [...new Set([...skipped, bookingId])];
    setSkipped(next);
    localStorage.setItem(SKIP_KEY, JSON.stringify(next));
  };

  const toReview = pending.filter((p) => !skipped.includes(p.bookingId));

  return (
    <div>
      <PageHeader title="My Reviews" description="Share your experience and help other students." />

      {toReview.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold">Rate your recent sessions</h2>
          {toReview.map((p) => (
            <div
              key={p.bookingId}
              ref={p.bookingId === target ? targetRef : undefined}
              className={cn('mb-4', p.bookingId === target && 'rounded-2xl ring-2 ring-brand-400 ring-offset-2 ring-offset-background')}
            >
              <PendingCard p={p} onDone={() => skip(p.bookingId)} onSkip={() => skip(p.bookingId)} />
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-4 font-display text-lg font-bold">Your past reviews</h2>
      {mine.length === 0 ? (
        <EmptyState title="No reviews yet" description="After a completed session, you can rate your tutor here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mine.map((r) => (
            <MyReviewCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
