export const PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

/** URL page numbers are one-based; API and component page indexes are zero-based. */
export function pageIndexFromParam(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 0;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 2147483647 ? page - 1 : 0;
}

export function pageSizeFromParam(value: string | null): number {
  const size = Number(value);
  return PAGE_SIZE_OPTIONS.some((option) => option === size) ? size : DEFAULT_PAGE_SIZE;
}
