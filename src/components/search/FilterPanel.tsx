import { RotateCcw } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import type { SearchFilters } from '@/types';
import { CITIES, GRADE_LEVELS, POPULAR_SUBJECTS, PRICE_BOUNDS } from '@/constants';
import { useCatalogs } from '@/hooks/useCatalogs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RatingStars } from '@/components/common/RatingStars';

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
}

const MODES = [
  { value: 'all', label: 'Any mode' },
  { value: 'online', label: 'Online' },
  { value: 'home_visit', label: 'Home Visit' },
  { value: 'institute', label: 'Institute' },
];
const LANGS = ['all', 'Urdu', 'English', 'Both'];
const GENDERS = [
  { value: 'any', label: 'Any' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const min = filters.minPrice ?? PRICE_BOUNDS.min;
  const max = filters.maxPrice ?? PRICE_BOUNDS.max;
  const catalogs = useCatalogs();
  const subjects = catalogs.subjects.length ? catalogs.subjects.map((s) => s.value) : POPULAR_SUBJECTS;
  const cities = catalogs.cities.length ? catalogs.cities.map((c) => c.value) : (CITIES as string[]);
  const gradeLevels = catalogs['grade-levels'].length
    ? catalogs['grade-levels'].map((g) => g.value)
    : GRADE_LEVELS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label>Subject</Label>
        <Select
          value={filters.subject ?? 'all'}
          onValueChange={(v) => onChange({ subject: v === 'all' ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any subject</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label>City</Label>
        <Select
          value={filters.city ?? 'all'}
          onValueChange={(v) => onChange({ city: v as SearchFilters['city'] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Hourly rate</Label>
          <span className="text-xs font-semibold text-muted-foreground">
            {formatPKR(min)} – {formatPKR(max)}
          </span>
        </div>
        <Slider
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={PRICE_BOUNDS.step}
          value={[min, max]}
          onValueChange={([lo, hi]) => onChange({ minPrice: lo, maxPrice: hi })}
        />
      </div>

      <Separator />

      {/* Mode */}
      <div className="space-y-2">
        <Label>Teaching mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onChange({ mode: m.value as SearchFilters['mode'] })}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                (filters.mode ?? 'all') === m.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'hover:bg-secondary',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label>Language</Label>
        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => onChange({ language: l as SearchFilters['language'] })}
              className={cn(
                'rounded-md border px-3 py-1 text-sm transition-colors',
                (filters.language ?? 'all') === l
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'hover:bg-secondary',
              )}
            >
              {l === 'all' ? 'Any' : l}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>Tutor gender</Label>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              onClick={() => onChange({ gender: g.value as SearchFilters['gender'] })}
              className={cn(
                'rounded-md border px-3 py-1 text-sm transition-colors',
                (filters.gender ?? 'any') === g.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'hover:bg-secondary',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div className="space-y-2">
        <Label>Minimum rating</Label>
        <div className="space-y-1.5">
          {[4.5, 4, 3.5, 0].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ minRating: r })}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                (filters.minRating ?? 0) === r ? 'bg-secondary' : 'hover:bg-secondary/60',
              )}
            >
              {r === 0 ? (
                <span className="text-muted-foreground">Any rating</span>
              ) : (
                <>
                  <RatingStars value={r} size={14} />
                  <span className="text-muted-foreground">& up</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Grade levels */}
      <div className="space-y-2">
        <Label>Grade level</Label>
        <div className="grid gap-2">
          {gradeLevels.slice(2, 7).map((g) => (
            <label key={g} className="flex items-center gap-2.5 text-sm">
              <Checkbox /> {g}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-xl border bg-secondary/40 p-3">
        <span className="text-sm font-medium">Verified tutors only</span>
        <Checkbox
          checked={filters.verifiedOnly ?? false}
          onCheckedChange={(v) => onChange({ verifiedOnly: Boolean(v) })}
        />
      </label>
    </div>
  );
}
