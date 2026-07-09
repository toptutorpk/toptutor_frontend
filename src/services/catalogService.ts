import { http } from '@/api/client';

/** One catalog entry from the backend (subject, grade level, mode, language, city). */
export interface CatalogItem {
  id: number;
  /** Stable key sent back on a profile/search (subject/grade/city name, mode/language code). */
  value: string;
  /** Human-readable display text. */
  label: string;
  /** Optional grouping (subjects only). */
  category?: string;
}

/** All catalogs keyed by their URL path segment. */
export interface CatalogMap {
  subjects: CatalogItem[];
  'grade-levels': CatalogItem[];
  modes: CatalogItem[];
  languages: CatalogItem[];
  cities: CatalogItem[];
}

export const catalogService = {
  /** Fetches every reference catalog in one call. */
  async getAll(): Promise<CatalogMap> {
    return http.get<CatalogMap>('/catalog');
  },
};
