import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { tutorService } from '@/services/tutorService';
import { contentService } from '@/services/contentService';
import { subjectCatalogService } from '@/services/subjectCatalogService';
import type { SearchFilters } from '@/types';

export function useTutors(filters: SearchFilters) {
  return useQuery({
    queryKey: queryKeys.tutors.list(filters),
    queryFn: () => tutorService.list(filters),
  });
}

export function useFeaturedTutors() {
  return useQuery({
    queryKey: queryKeys.tutors.featured,
    queryFn: () => tutorService.featured(),
  });
}

export function useTutor(slug: string) {
  return useQuery({
    queryKey: queryKeys.tutors.detail(slug),
    queryFn: () => tutorService.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useSubjects() {
  return useQuery({ queryKey: queryKeys.subjects.all, queryFn: () => contentService.subjects() });
}

/**
 * Categories, subjects, artwork and live tutor counts for the browse page.
 *
 * <p>Kept fresh for a few minutes rather than re-fetched on every focus: the catalogue changes when
 * an admin edits it, and the counts when a tutor is verified — neither is a per-second concern, and
 * this is the first request a visitor makes on the page.
 */
export function useSubjectCatalog() {
  return useQuery({
    queryKey: queryKeys.subjects.browse,
    queryFn: () => subjectCatalogService.browse(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats.all, queryFn: () => contentService.stats() });
}
