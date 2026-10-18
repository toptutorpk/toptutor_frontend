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
  /** Banks a tutor can be paid into. */
  'payout-banks': CatalogItem[];
  /** Mobile wallets a tutor can be paid into. */
  'payout-wallets': CatalogItem[];
}

export const catalogService = {
  /** Fetches every reference catalog in one call. */
  async getAll(): Promise<CatalogMap> {
    return http.get<CatalogMap>('/catalog');
  },

  /**
   * One catalog on its own.
   *
   * Used where a page needs a single list rather than all of them — the payout form wants banks
   * and wallets, and pulling the whole subject taxonomy to fill a dropdown of banks is waste.
   */
  async getOne(path: keyof CatalogMap): Promise<CatalogItem[]> {
    return http.get<CatalogItem[]>(`/catalog/${path}`);
  },
};
