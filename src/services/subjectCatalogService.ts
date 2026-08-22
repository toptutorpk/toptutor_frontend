import { http } from '@/api/client';
import { categoryGradient, subjectGradient } from '@/lib/subjectColor';
import type { Subject } from '@/types';

/* ============================================================================
   Subject catalogue — backed by the real backend.

   Categories, subjects, artwork and tutor counts all come from the database, so
   adding a subject is a row rather than a release. The icon is stored as a name
   (see `lib/icons`) rather than as an uploaded file, which is what makes that
   true: there is no asset to ship alongside the row.

   Tutor counts are computed server-side under the same visibility rule as the
   tutor listing — active, profiled and fully verified. That is deliberate: a
   count assembled here from a different rule would advertise tutors that
   clicking the subject fails to show.
   ========================================================================== */

interface BackendSubject {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  tutorCount: number;
}

interface BackendCategory {
  id: number | null;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  tutorCount: number;
  subjects: BackendSubject[];
}

interface BackendBrowse {
  categories: BackendCategory[];
  totalSubjects: number;
  totalTutors: number;
}

/** A category as the browse rail needs it: identity, artwork, and how many tutors sit behind it. */
export interface SubjectCategory {
  /** Null only for the synthetic bucket holding subjects whose category was deleted. */
  id: number | null;
  name: string;
  slug: string;
  icon: string;
  /** Ready-to-use Tailwind gradient classes, resolved from the stored colour token. */
  gradient: string;
  tutorCount: number;
  subjects: Subject[];
}

export interface SubjectCatalog {
  categories: SubjectCategory[];
  subjects: Subject[];
  totalSubjects: number;
  totalTutors: number;
}

/**
 * Last-resort icon for a row with none of its own — which today means one created directly in the
 * database. It exists so that case renders as a plain tile rather than as an invisible one. Colour
 * has its own fallback inside `subjectColor`.
 */
const FALLBACK_ICON = 'BookOpen';

function toSubject(subject: BackendSubject, category: BackendCategory): Subject {
  return {
    id: String(subject.id),
    name: subject.name,
    slug: subject.slug,
    icon: subject.icon ?? category.icon ?? FALLBACK_ICON,
    tutorCount: subject.tutorCount,
    category: category.name,
    // Not inherited from the category: see `subjectGradient`. A whole category rendered in one
    // shade stops reading as a set of separate subjects.
    gradient: subjectGradient(subject.slug, subject.color),
  };
}

export const subjectCatalogService = {
  async browse(): Promise<SubjectCatalog> {
    const data = await http.get<BackendBrowse>('/catalog/subjects/browse');

    const categories = data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? FALLBACK_ICON,
      gradient: categoryGradient(category.color),
      tutorCount: category.tutorCount,
      subjects: category.subjects.map((subject) => toSubject(subject, category)),
    }));

    return {
      categories,
      // Flattened once here rather than on every render of the "All" tab. Category order is the
      // server's, which is chosen by how many tutors teach each — not alphabetical.
      subjects: categories.flatMap((category) => category.subjects),
      totalSubjects: data.totalSubjects,
      totalTutors: data.totalTutors,
    };
  },
};
