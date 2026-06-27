import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { TutorCard, TutorCardSkeleton } from '@/components/cards/TutorCard';
import { Button } from '@/components/ui/button';
import { useFeaturedTutors } from '@/hooks/useTutors';

export function FeaturedTutors() {
  const { data: tutors, isLoading } = useFeaturedTutors();
  return (
    <Container>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeading
          align="left"
          eyebrow="Top rated"
          title="Featured verified tutors"
          description="Hand-picked, fully verified tutors with outstanding parent reviews."
          className="!mx-0"
        />
        <Button variant="ghost" asChild>
          <Link to="/tutors">
            Browse all tutors <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <TutorCardSkeleton key={i} />)
          : tutors?.map((t, i) => <TutorCard key={t.id} tutor={t} index={i} />)}
      </div>
    </Container>
  );
}
