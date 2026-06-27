import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { TutorCard, TutorCardSkeleton } from '@/components/cards/TutorCard';
import { EmptyState } from '@/components/common/StateViews';
import { Heart } from 'lucide-react';
import { useTutors } from '@/hooks/useTutors';
import { useUIStore } from '@/store/uiStore';

export default function StudentFavorites() {
  const favorites = useUIStore((s) => s.favorites);
  const { data, isLoading } = useTutors({});
  const favTutors = data?.items.filter((t) => favorites.includes(t.id)) ?? [];

  return (
    <div>
      <PageHeader title="Favorite Tutors" description="Tutors you’ve saved for later." />
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <TutorCardSkeleton key={i} />
          ))}
        </div>
      ) : favTutors.length === 0 ? (
        <div className="rounded-2xl border bg-card">
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Tap the heart on any tutor to save them here for quick access."
          />
          <div className="pb-8 text-center">
            <Link to="/tutors" className="font-semibold text-primary hover:underline">
              Browse tutors →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {favTutors.map((t, i) => (
            <TutorCard key={t.id} tutor={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
