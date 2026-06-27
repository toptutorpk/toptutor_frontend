import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RatingStars } from '@/components/common/RatingStars';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { getInitials } from '@/lib/utils';
import { TUTORS } from '@/services/mock/tutors';
import { toast } from '@/components/ui/sonner';

export default function StudentReviews() {
  const myReviews = TUTORS.slice(0, 2).map((t) => t.reviews[0]);
  const pending = TUTORS.slice(2, 3);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  return (
    <div>
      <PageHeader title="My Reviews" description="Share your experience and help other parents." />

      {/* Pending review */}
      {pending.map((t) => (
        <div key={t.id} className="mb-8 rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={t.avatarUrl} alt={t.name} />
              <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">How was your session with {t.name}?</div>
              <div className="text-sm text-muted-foreground">{t.subjects[0]} · Completed 2 days ago</div>
            </div>
          </div>
          <div className="mt-4">
            <RatingStars value={rating} interactive onChange={setRating} size={28} />
          </div>
          <Textarea
            className="mt-3"
            placeholder="What did you like about the session?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            variant="gradient"
            className="mt-3"
            onClick={() => {
              toast.success('Review submitted', { description: 'Thanks for your feedback!' });
              setText('');
            }}
          >
            Submit Review
          </Button>
        </div>
      ))}

      <h2 className="mb-4 font-display text-lg font-bold">Your past reviews</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {myReviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}
