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
