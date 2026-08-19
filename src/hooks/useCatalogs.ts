import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Video, Home, Building2, type LucideIcon } from 'lucide-react';
import { catalogService, type CatalogMap } from '@/services/catalogService';
import { CITIES, GRADE_LEVELS, POPULAR_SUBJECTS } from '@/constants';
import { LANGUAGE_OPTIONS, MODE_OPTIONS } from '@/components/tutor/profileFieldOptions';
import type { SessionMode, TeachingLanguage } from '@/types';

const EMPTY: CatalogMap = { subjects: [], 'grade-levels': [], modes: [], languages: [], cities: [] };

/** Icons live client-side (they can't come from the DB); map a mode code to its icon. */
const MODE_ICONS: Record<string, LucideIcon> = {
  online: Video,
  home_visit: Home,
  institute: Building2,
};

/**
 * Fetches the reference catalogs from the backend once (cached for the session). Falls back to the
 * bundled constants until the request resolves (or if it fails), so forms always render.
 */
export function useCatalogs(): CatalogMap {
  const { data } = useQuery({
    queryKey: ['catalogs'],
    queryFn: () => catalogService.getAll(),
    staleTime: 1000 * 60 * 60, // catalogs rarely change within a session
  });
  return data ?? EMPTY;
}

/** A category and the subjects filed under it, in the order the server returned them. */
export interface SubjectGroup {
  category: string;
  subjects: string[];
}

/** Shown for subjects the server sent without a category, rather than dropping them. */
const UNCATEGORISED = 'Other';

/**
 * Subjects grouped by category, preserving server order.
 *
 * <p>The catalog arrives already sorted by category and then by subject, so grouping is a single
 * pass and the result needs no sorting of its own — the order tutors see is the order the taxonomy
 * defines, which puts the subjects most people teach at the top of each list rather than whatever
 * happens to start with "A".
 */
export function useSubjectGroups(): SubjectGroup[] {
  const c = useCatalogs();
  return useMemo(() => {
    const groups: SubjectGroup[] = [];
    const byCategory = new Map<string, SubjectGroup>();
    for (const s of c.subjects) {
      const category = s.category ?? UNCATEGORISED;
      let group = byCategory.get(category);
      if (!group) {
        group = { category, subjects: [] };
        byCategory.set(category, group);
        groups.push(group);
      }
      group.subjects.push(s.value);
    }
    return groups;
  }, [c.subjects]);
}

/** Maps a subject name back to its category, for rendering "Category › Subject" on a selection. */
export function useSubjectCategoryIndex(): Record<string, string> {
  const c = useCatalogs();
  return useMemo(() => {
    const index: Record<string, string> = {};
    for (const s of c.subjects) index[s.value] = s.category ?? UNCATEGORISED;
    return index;
  }, [c.subjects]);
}

/** Catalog options shaped for the tutor profile forms, with graceful fallbacks to constants. */
export function useProfileCatalogs() {
  const c = useCatalogs();
  return {
    subjects: c.subjects.length ? c.subjects.map((s) => s.value) : POPULAR_SUBJECTS,
    gradeLevels: c['grade-levels'].length ? c['grade-levels'].map((g) => g.value) : GRADE_LEVELS,
    cities: c.cities.length ? c.cities.map((x) => x.value) : (CITIES as string[]),
    languages: c.languages.length
      ? c.languages.map((l) => ({ value: l.value as TeachingLanguage, label: l.label }))
      : LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l === 'Both' ? 'Urdu & English' : l })),
    modes: c.modes.length
      ? c.modes.map((m) => ({
          value: m.value as SessionMode,
          label: m.label,
          icon: MODE_ICONS[m.value] ?? Video,
        }))
      : MODE_OPTIONS,
  };
}
