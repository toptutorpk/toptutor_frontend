import { useState } from 'react';
import { format } from 'date-fns';
import { CornerDownRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RatingStars } from '@/components/common/RatingStars';
import { EmptyState } from '@/components/common/StateViews';
import { getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, type TutorReview } from '@/services/reviewService';

function ReviewRow({ r }: { r: TutorReview }) {
  const [reply, setReply] = useState('');
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();
  const respond = useMutation({
    mutationFn: () => reviewService.respond(r.id, reply.trim()),
    onSuccess: () => {
      toast.success('Reply saved');
      qc.invalidateQueries({ queryKey: ['reviews', 'received'] });
      setEditing(false);
    },
    onError: (e: unknown) => toast.error('Could not save reply', { description: (e as Error).message }),
  });

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={r.studentAvatar ?? undefined} alt={r.studentName} />
          <AvatarFallback>{getInitials(r.studentName || 'Student')}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{r.studentName || 'Student'}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(r.date), 'MMM d, yyyy')}</p>
            </div>
            <RatingStars value={r.rating} size={14} />
          </div>
          {r.comment && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.comment}</p>}

          {r.tutorResponse && !editing ? (
            <div className="mt-3 rounded-xl border-l-2 border-brand-400 bg-secondary/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <CornerDownRight className="h-3.5 w-3.5" /> Your response
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{r.tutorResponse}</p>
              <button
                onClick={() => {
                  setReply(r.tutorResponse ?? '');
                  setEditing(true);
                }}
                className="mt-2 text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Edit reply
              </button>
            </div>
          ) : editing || !r.tutorResponse ? (
            <div className="mt-3">
              <Textarea
                placeholder="Write a reply to this review…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="gradient"
                  disabled={respond.isPending || !reply.trim()}
                  onClick={() => respond.mutate()}
                >
                  {respond.isPending ? 'Saving…' : 'Reply'}
                </Button>
                {editing && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TutorReviews() {
  const { data: reviews = [] } = useQuery({ queryKey: ['reviews', 'received'], queryFn: reviewService.received });

  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  return (
    <div>
      <PageHeader title="Reviews" description="What students say about your sessions — and your replies." />

      {count > 0 && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft">
          <div className="text-center">
            <div className="font-display text-4xl font-extrabold text-gradient">{avg.toFixed(1)}</div>
            <RatingStars value={avg} size={14} className="mt-1 justify-center" />
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {count} review{count === 1 ? '' : 's'} from your students.
          </div>
        </div>
      )}

      {count === 0 ? (
        <EmptyState title="No reviews yet" description="Once students review their sessions, they’ll appear here." />
      ) : (
        <div className="grid gap-4">
          {reviews.map((r) => (
            <ReviewRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
