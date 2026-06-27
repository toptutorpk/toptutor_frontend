import { useState } from 'react';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { SubjectCard } from '@/components/cards/SubjectCard';
import { StaggerGroup, StaggerItem } from '@/components/animations/Stagger';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSubjects } from '@/hooks/useTutors';
import { SUBJECT_CATEGORIES } from '@/services/mock/subjects';

export default function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects();
  const [category, setCategory] = useState<string>('All');
  const filtered =
    category === 'All' ? subjects : subjects?.filter((s) => s.category === category);

  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          eyebrow="Browse"
          title="Find tutors by subject"
          description="Explore verified expert tutors across every subject, grade and exam board in Pakistan."
        />

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {['All', ...SUBJECT_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                category === c
                  ? 'border-brand-500 bg-brand-600 text-white'
                  : 'hover:bg-secondary',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <StaggerGroup className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered?.map((s) => (
              <StaggerItem key={s.id}>
                <SubjectCard subject={s} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Container>
    </div>
  );
}
