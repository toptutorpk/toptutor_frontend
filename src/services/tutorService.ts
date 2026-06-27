import { apiClient } from '@/api/client';
import { env } from '@/config/env';
import { sleep } from '@/lib/utils';
import { TUTORS, findTutorBySlug } from '@/services/mock/tutors';
import type { Paginated, SearchFilters, Tutor } from '@/types';

const PAGE_SIZE = 9;

function applyFilters(tutors: Tutor[], f: SearchFilters): Tutor[] {
  let result = [...tutors];
  if (f.query) {
    const q = f.query.toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.headline.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q)),
    );
  }
  if (f.subject && f.subject !== 'all')
    result = result.filter((t) =>
      t.subjects.some((s) => s.toLowerCase().includes(f.subject!.toLowerCase())),
    );
  if (f.city && f.city !== 'all') result = result.filter((t) => t.city === f.city);
  if (f.mode && f.mode !== 'all') {
    const mode = f.mode;
    result = result.filter((t) => t.modes.includes(mode));
  }
  if (f.language && f.language !== 'all')
    result = result.filter((t) => t.languages === f.language || t.languages === 'Both');
  if (f.gender && f.gender !== 'any') result = result.filter((t) => t.gender === f.gender);
  if (typeof f.minPrice === 'number') result = result.filter((t) => t.hourlyRate >= f.minPrice!);
  if (typeof f.maxPrice === 'number') result = result.filter((t) => t.hourlyRate <= f.maxPrice!);
  if (typeof f.minRating === 'number') result = result.filter((t) => t.rating >= f.minRating!);
  if (f.verifiedOnly) result = result.filter((t) => t.verificationStatus === 'verified');

  switch (f.sort) {
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'price_low':
      result.sort((a, b) => a.hourlyRate - b.hourlyRate);
      break;
    case 'price_high':
      result.sort((a, b) => b.hourlyRate - a.hourlyRate);
      break;
    case 'experience':
      result.sort((a, b) => b.experienceYears - a.experienceYears);
      break;
    default:
      result.sort((a, b) => Number(b.isPremium) - Number(a.isPremium) || b.rating - a.rating);
  }
  return result;
}

export const tutorService = {
  async list(filters: SearchFilters = {}): Promise<Paginated<Tutor>> {
    if (env.useMocks) {
      await sleep(450);
      const filtered = applyFilters(TUTORS, filters);
      const page = filters.page ?? 1;
      const start = (page - 1) * PAGE_SIZE;
      return {
        items: filtered.slice(start, start + PAGE_SIZE),
        total: filtered.length,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
      };
    }
    const { data } = await apiClient.get<Paginated<Tutor>>('/tutors', { params: filters });
    return data;
  },

  async featured(): Promise<Tutor[]> {
    if (env.useMocks) {
      await sleep(300);
      return TUTORS.filter((t) => t.isPremium).slice(0, 6);
    }
    const { data } = await apiClient.get<Tutor[]>('/tutors/featured');
    return data;
  },

  async getBySlug(slug: string): Promise<Tutor> {
    if (env.useMocks) {
      await sleep(350);
      const tutor = findTutorBySlug(slug);
      if (!tutor) throw new Error('Tutor not found');
      return tutor;
    }
    const { data } = await apiClient.get<Tutor>(`/tutors/${slug}`);
    return data;
  },
};
