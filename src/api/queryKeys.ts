import type { SearchFilters } from '@/types';

/** Centralized React Query keys for cache consistency. */
export const queryKeys = {
  tutors: {
    all: ['tutors'] as const,
    list: (filters: SearchFilters) => ['tutors', 'list', filters] as const,
    detail: (slug: string) => ['tutors', 'detail', slug] as const,
    featured: ['tutors', 'featured'] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    detail: (slug: string) => ['subjects', slug] as const,
    /** Categories + subjects + live tutor counts, as the browse page needs them. */
    browse: ['subjects', 'browse'] as const,
  },
  bookings: { all: ['bookings'] as const },
  conversations: { all: ['conversations'] as const },
  messages: (conversationId: string) => ['messages', conversationId] as const,
  notifications: { all: ['notifications'] as const },
  stats: { all: ['stats'] as const },
};
