import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { tutorService } from '@/services/tutorService';
import { contentService } from '@/services/contentService';
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

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats.all, queryFn: () => contentService.stats() });
}
