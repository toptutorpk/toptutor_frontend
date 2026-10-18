import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import type { SearchFilters } from '@/types';
import { Container } from '@/components/common/Container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FilterPanel } from '@/components/search/FilterPanel';
import { TutorCard, TutorListCardSkeleton } from '@/components/cards/TutorCard';
import { Pagination } from '@/components/common/Pagination';
import { NoResults, NoMorePages, ErrorState } from '@/components/common/StateViews';
import { useTutors } from '@/hooks/useTutors';

const SORTS: { value: NonNullable<SearchFilters['sort']>; label: string }[] = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'experience', label: 'Most experienced' },
];

export default function TutorListingPage() {
  const [params, setParams] = useSearchParams();

  const filters: SearchFilters = useMemo(() => {
    const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
    return {
      query: params.get('q') ?? undefined,
      subject: params.get('subject') ?? undefined,
      city: (params.get('city') as SearchFilters['city']) ?? undefined,
      mode: (params.get('mode') as SearchFilters['mode']) ?? undefined,
      language: (params.get('language') as SearchFilters['language']) ?? undefined,
      gender: (params.get('gender') as SearchFilters['gender']) ?? undefined,
      minPrice: num('minPrice'),
      maxPrice: num('maxPrice'),
      minRating: num('minRating'),
      gradeLevel: params.get('gradeLevel') ?? undefined,
      sort: (params.get('sort') as SearchFilters['sort']) ?? 'relevance',
      page: num('page') ?? 1,
    };
  }, [params]);

  const { data, isLoading, isError, refetch } = useTutors(filters);

  const patch = (next: Partial<SearchFilters>) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      Object.entries(next).forEach(([k, v]) => {
        const key = k === 'query' ? 'q' : k;
        // No `v === false` case: verifiedOnly was the only boolean filter, and with it gone every
        // remaining value is a string or a number.
        if (v === undefined || v === null || v === '' || v === 'all' || v === 'any') {
          p.delete(key);
        } else {
          p.set(key, String(v));
        }
      });
      if (!('page' in next)) p.set('page', '1');
      return p;
    });
  };

  const reset = () => setParams(new URLSearchParams());

  const activeChips = buildActiveChips(filters);

  return (
    <div className="py-8 lg:py-10">
      <Container size="wide">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Find your verified tutor
          </h1>
          <p className="text-muted-foreground">
            {data ? `${data.total} verified tutors` : 'Browse verified tutors'} ready to help.
          </p>
        </div>

        {/* Search + sort bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              defaultValue={filters.query ?? ''}
              placeholder="Search by subject, name or keyword…"
              className="h-12 pl-11"
              onKeyDown={(e) => {
                if (e.key === 'Enter') patch({ query: (e.target as HTMLInputElement).value });
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="h-12 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              {/* Also unpadded, for the same reason as the sidebar: the panel's sections carry
                  their own padding and their dividers have to reach both edges. */}
              <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0 pt-4">
                <FilterPanel filters={filters} onChange={patch} onReset={reset} />
              </SheetContent>
            </Sheet>
            <Select value={filters.sort} onValueChange={(v) => patch({ sort: v as SearchFilters['sort'] })}>
              <SelectTrigger className="h-12 w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeChips.map((c) => (
              <Badge key={c.key} variant="secondary" className="gap-1.5 py-1 pl-3 pr-1.5">
                {c.label}
                <button
                  onClick={() => patch({ [c.key]: undefined } as Partial<SearchFilters>)}
                  className="rounded-sm p-0.5 hover:bg-background"
                  aria-label={`Remove ${c.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button onClick={reset} className="text-xs font-medium text-primary hover:underline">
              Clear all
            </button>
          </div>
        )}

        {/* Layout */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            {/* The single boundary. `overflow-hidden` clips the panel's banded sections to these
                corners; no padding, because each section supplies its own so the dividers between
                them span the full width. */}
            <div className="sticky top-24 overflow-hidden rounded-2xl border bg-card shadow-soft">
              <FilterPanel filters={filters} onChange={patch} onReset={reset} />
            </div>
          </aside>

          <div>
            {isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TutorListCardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.items.length === 0 && (filters.page ?? 1) > 1 ? (
              /* Past the last page — which is not the same as matching nothing. Telling someone
                 their filters are too narrow when page 1 is full of results sends them to undo a
                 search that was working. */
              <NoMorePages onBack={() => patch({ page: 1 })} />
            ) : data && data.items.length === 0 ? (
              <NoResults onReset={reset} />
            ) : (
              <>
                <div className="space-y-4">
                  {data?.items.map((t, i) => (
                    <TutorCard key={t.id} tutor={t} index={i} variant="list" />
                  ))}
                </div>
                <Pagination
                  className="mt-10"
                  page={data?.page ?? 1}
                  totalPages={data?.totalPages ?? 1}
                  onChange={(p) => patch({ page: p })}
                />
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

function buildActiveChips(f: SearchFilters) {
  const chips: { key: keyof SearchFilters; label: string }[] = [];
  if (f.query) chips.push({ key: 'query', label: `“${f.query}”` });
  if (f.subject) chips.push({ key: 'subject', label: f.subject });
  if (f.city && f.city !== 'all') chips.push({ key: 'city', label: f.city });
  if (f.mode && f.mode !== 'all') chips.push({ key: 'mode', label: f.mode.replace('_', ' ') });
  if (f.language && f.language !== 'all') chips.push({ key: 'language', label: f.language });
  if (f.gender && f.gender !== 'any') chips.push({ key: 'gender', label: f.gender });
  if (f.minRating) chips.push({ key: 'minRating', label: `${f.minRating}★ & up` });
  // Listed like every other filter: a chip row that silently omits one is worse than no chip row,
  // because it becomes a list you cannot trust to be complete.
  if (f.gradeLevel) chips.push({ key: 'gradeLevel', label: f.gradeLevel });
  return chips;
}
