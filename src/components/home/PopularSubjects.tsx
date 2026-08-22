import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { StaggerGroup, StaggerItem } from '@/components/animations/Stagger';
import { SubjectCard } from '@/components/cards/SubjectCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSubjectCatalog } from '@/hooks/useTutors';

export function PopularSubjects() {
  // Same source as the subjects page, so the tutor counts here are the real ones and agree with it.
  // Sharing the query key also means the visitor who follows "View all subjects" arrives to a page
  // that is already populated.
  const { data, isLoading } = useSubjectCatalog();
  // "Popular" is by tutor supply: the subjects someone can actually book today, most first. A slice
  // of the catalogue in its stored order would instead show whatever happens to sort first, which
  // on this taxonomy is seventy-odd languages.
  const subjects = data?.subjects
    ? [...data.subjects].sort((a, b) => b.tutorCount - a.tutorCount).slice(0, 12)
    : undefined;
  return (
    <Container>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeading
          align="left"
          eyebrow="Explore"
          title="Popular subjects"
          description="From Matric to A-Levels and university — find expert help in any subject."
          className="!mx-0"
        />
        <Button variant="ghost" asChild>
          <Link to="/subjects">
            View all subjects <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <StaggerGroup className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {subjects?.map((s) => (
            <StaggerItem key={s.id}>
              <SubjectCard subject={s} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </Container>
  );
}
