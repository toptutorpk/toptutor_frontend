import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { SubjectCard } from '@/components/cards/SubjectCard';
import { CategoryRail, ALL_CATEGORIES } from '@/components/subjects/CategoryRail';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubjectCatalog } from '@/hooks/useTutors';

/**
 * How many tiles cascade before the rest arrive together.
 *
 * <p>Roughly the first two rows on a wide screen — enough for the grid to feel like it assembles,
 * while everything past it is below the fold and gains nothing from waiting its turn.
 */
const MAX_CASCADE = 7;

/**
 * Browse every subject on the platform, filtered by category.
 *
 * <p>Categories, subjects, artwork and tutor counts all come from the database — nothing on this
 * page is hardcoded, so a subject added in the admin portal appears here without a release.
 */
export default function SubjectsPage() {
  const { data, isLoading, isError } = useSubjectCatalog();
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);

  const subjects = useMemo(() => {
    if (!data) return [];
    if (category === ALL_CATEGORIES) return data.subjects;
    return data.categories.find((c) => c.slug === category)?.subjects ?? [];
  }, [data, category]);

  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          eyebrow="Browse"
          title="Find tutors by subject"
          description="Explore verified expert tutors across every subject, grade and exam board in Pakistan."
        />

        {isLoading ? (
          <SubjectsSkeleton />
        ) : isError ? (
          <Notice
            title="We couldn't load the subject list"
            body="Something went wrong on our side. Please refresh the page to try again."
          />
        ) : data ? (
          <>
            <div className="mt-8">
              <CategoryRail
                categories={data.categories}
                value={category}
                onChange={setCategory}
                totalSubjects={data.totalSubjects}
                totalTutors={data.totalTutors}
              />
            </div>

            {subjects.length === 0 ? (
              <Notice
                title="No subjects in this category yet"
                body="Try another category — we're adding new subjects all the time."
              />
            ) : (
              <div
                // Keyed on the category so switching replays the entrance. Without it the grid
                // swaps its contents in place and the change reads as a glitch rather than a filter.
                key={category}
                className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              >
                {subjects.map((subject, i) => (
                  <div
                    key={subject.id}
                    className="animate-rise-in"
                    // Capped, unlike the shared stagger helper. The first two rows cascade, and
                    // everything below them — which is off-screen anyway — arrives together at
                    // 0.24s. Uncapped, "All Subjects" scheduled its last tile 22 seconds out and
                    // the page looked broken.
                    style={{ animationDelay: `${Math.min(i, MAX_CASCADE) * 0.03}s` }}
                  >
                    <SubjectCard subject={subject} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </Container>
    </div>
  );
}

function SubjectsSkeleton() {
  return (
    <>
      <div className="no-scrollbar mt-8 flex gap-2.5 overflow-hidden px-1 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[58px] w-44 shrink-0 rounded-xl" />
        ))}
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed bg-secondary/30 px-6 py-14 text-center">
      <SearchX className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-display font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
