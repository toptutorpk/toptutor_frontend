import { Navigate, useParams } from 'react-router-dom';
import { Container } from '@/components/common/Container';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubjectCatalog } from '@/hooks/useTutors';

/**
 * Resolves `/subjects/<slug>` to the tutor listing filtered by that subject.
 *
 * <p>The two sides speak different keys: URLs use a slug because it is stable and readable, while
 * the search API matches on the subject's name. This is the one place that translation happens,
 * rather than teaching the listing page a second way to be filtered.
 *
 * <p>Kept as a route rather than deleted because the URL is shareable and may already be linked —
 * and because it used to render the listing with no filter applied, quietly showing every tutor on
 * the platform under a subject's heading.
 */
export default function SubjectRedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useSubjectCatalog();

  if (isLoading) {
    return (
      <Container>
        <div className="space-y-4 py-16">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </Container>
    );
  }

  const subject = data?.subjects.find((s) => s.slug === slug);

  // An unknown slug goes back to the catalogue rather than to an empty listing: the subject may
  // have been renamed or retired, and a browsable page is more use than "no tutors found".
  return (
    <Navigate
      replace
      to={subject ? `/tutors?subject=${encodeURIComponent(subject.name)}` : '/subjects'}
    />
  );
}
