import { Check, Star } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import type { SearchFilters } from '@/types';
import { CITIES, GRADE_LEVELS, PRICE_BOUNDS } from '@/constants';
import { useCatalogs } from '@/hooks/useCatalogs';
import { SubjectFilter } from '@/components/search/SubjectFilter';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
}

/**
 * Teaching modes offered on the public site.
 *
 * <p>"Institute" is deliberately absent. A tutor who teaches at an academy is reached through the
 * institute's own portal, where verified institutes browse and hire them directly; offering it
 * here would send a parent looking for a private tutor into a pool they cannot book from.
 */
const MODES = [
  { value: 'online', label: 'Online', hint: 'Live video sessions' },
  { value: 'home_visit', label: 'Home visit', hint: 'Tutor comes to you' },
];

const LANGS = [
  { value: 'all', label: 'Any' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'English', label: 'English' },
  { value: 'Both', label: 'Both' },
];

const GENDERS = [
  { value: 'any', label: 'Any' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

const RATINGS = [0, 3, 4, 4.5];

/**
 * The tutor search filters.
 *
 * <p>Two of these controls used to do nothing at all: grade level had no state and no field on
 * {@code SearchFilters}, and {@code minRating} was collected but never forwarded by `toParams`.
 * Both now reach the API, which is the difference between a filter and a decoration.
 */
export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const min = filters.minPrice ?? PRICE_BOUNDS.min;
  const max = filters.maxPrice ?? PRICE_BOUNDS.max;
  const catalogs = useCatalogs();
  const cities = catalogs.cities.length ? catalogs.cities.map((c) => c.value) : (CITIES as string[]);
  const gradeLevels = catalogs['grade-levels'].length
    ? catalogs['grade-levels'].map((g) => g.value)
    : GRADE_LEVELS;

  // Counted from what is actually set rather than tracked separately, so the badge can never
  // disagree with the controls under it.
  const activeCount = [
    filters.subject,
    filters.city && filters.city !== 'all' ? filters.city : undefined,
    filters.mode && filters.mode !== 'all' ? filters.mode : undefined,
    filters.language && filters.language !== 'all' ? filters.language : undefined,
    filters.gender && filters.gender !== 'any' ? filters.gender : undefined,
    filters.minRating ? filters.minRating : undefined,
    filters.gradeLevel,
    filters.minPrice != null && filters.minPrice !== PRICE_BOUNDS.min ? filters.minPrice : undefined,
    filters.maxPrice != null && filters.maxPrice !== PRICE_BOUNDS.max ? filters.maxPrice : undefined,
  ].filter((v) => v !== undefined && v !== '').length;

  // No card of its own: the sidebar and the mobile sheet each already provide one, and drawing a
  // second inside it produced two nested rounded borders a few pixels apart. The banded sections
  // below need to reach the container's edge for their rules to read as dividers, so the
  // horizontal padding lives here rather than on the wrapper.
  return (
    <div>
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-extrabold tracking-tight">Filters</h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {activeCount} active
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={activeCount === 0}
          className="text-muted-foreground"
        >
          Clear all
        </Button>
      </header>

      <Section title="Subject" note={filters.subject ? '1 selected' : undefined}>
        <SubjectFilter value={filters.subject} onChange={(s) => onChange({ subject: s })} />
      </Section>

      <Section title="City">
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
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* The reference design puts a price histogram above this slider. It is not here because
          there is no distribution to draw: the panel sees one filtered page of results, and a
          histogram built from that would describe the filter rather than the market. The range
          itself is the part that does the work. */}
      <Section title="Hourly rate">
        <Slider
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={PRICE_BOUNDS.step}
          value={[min, max]}
          onValueChange={([lo, hi]) => onChange({ minPrice: lo, maxPrice: hi })}
        />
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Bound label="Min" value={min} />
          <span className="text-muted-foreground">–</span>
          <Bound label="Max" value={max} />
        </div>
      </Section>

      <Section title="Teaching mode">
        <div className="space-y-2">
          {MODES.map((m) => {
            const on = filters.mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={on}
                // Selecting the active mode again clears it, so "any mode" needs no extra control.
                onClick={() =>
                  onChange({ mode: (on ? 'all' : m.value) as SearchFilters['mode'] })
                }
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  on
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                    : 'hover:border-brand-300 hover:bg-secondary/50',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                    on ? 'border-brand-600 bg-brand-600 text-white' : 'border-input',
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block text-xs text-muted-foreground">{m.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Language">
        <Segmented
          options={LANGS}
          value={filters.language ?? 'all'}
          onSelect={(v) => onChange({ language: v as SearchFilters['language'] })}
        />
        <Label className="mt-4 block text-sm font-semibold">Tutor gender</Label>
        <div className="mt-2">
          <Segmented
            options={GENDERS}
            value={filters.gender ?? 'any'}
            onSelect={(v) => onChange({ gender: v as SearchFilters['gender'] })}
          />
        </div>
      </Section>

      <Section title="Minimum rating">
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => {
            const on = (filters.minRating ?? 0) === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ minRating: r })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors',
                  on
                    ? 'border-brand-500 bg-brand-50/60 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'hover:border-brand-300 hover:bg-secondary/50',
                )}
              >
                <Star
                  className={cn(
                    'h-3.5 w-3.5',
                    r === 0 ? 'text-muted-foreground' : 'fill-gold-400 text-gold-400',
                  )}
                />
                {r === 0 ? 'Any' : `${r}+`}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Grade level" note={filters.gradeLevel ? '1 selected' : undefined} last>
        <div className="grid gap-2 sm:grid-cols-2">
          {gradeLevels.map((g) => {
            const on = filters.gradeLevel === g;
            const [name, detail] = splitLevel(g);
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ gradeLevel: on ? undefined : g })}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition-colors',
                  on
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                    : 'hover:border-brand-300 hover:bg-secondary/50',
                )}
              >
                <span
                  className={cn(
                    'block text-sm font-semibold',
                    on && 'text-brand-700 dark:text-brand-300',
                  )}
                >
                  {name}
                </span>
                {detail && (
                  <span className="block text-xs text-muted-foreground">{detail}</span>
                )}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/**
 * Splits a catalogue level into a name and its detail.
 *
 * <p>The catalogue already carries both — "Matric (9-10)", "Primary (1-5)" — crammed into one
 * string. Two lines keeps the name scannable and the range readable; a level with no parenthetical
 * simply has no second line. The full original string is still what gets filtered on, so this is
 * presentation only and cannot drift from the value sent to the server.
 */
function splitLevel(level: string): [string, string | null] {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(level);
  if (!match) return [level, null];
  const [, name, detail] = match;
  // A bare range reads better with a word in front of it; anything else is already a phrase.
  return [name, /^[\d\s–-]+$/.test(detail) ? `Grades ${detail}` : detail];
}

/** One banded group. The rules between them are what stop the panel reading as one long list. */
function Section({
  title,
  note,
  last,
  children,
}: {
  title: string;
  note?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('px-5 py-5', !last && 'border-b')}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-bold">{title}</h4>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}

/**
 * A read-out of one end of the range. Not an input: the slider owns the value.
 *
 * <p>`whitespace-nowrap` is the point of this component. In a 280px sidebar "PKR 8,000" wrapped
 * after "PKR" while "PKR 500" did not, so the two boxes rendered at different heights and the row
 * looked broken. The unit moves into the label instead, which keeps the figure on one line at any
 * value the bounds allow and lets the two numbers be compared without reading "PKR" twice.
 */
function Bound({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl border bg-secondary/30 px-3 py-2">
      <span className="block text-[11px] leading-tight text-muted-foreground">{label} (PKR)</span>
      <span className="block whitespace-nowrap text-sm font-bold leading-snug tabular-nums">
        {formatPKR(value).replace('PKR ', '')}
      </span>
    </div>
  );
}

/** A row of mutually exclusive choices, sharing one track. */
function Segmented({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex rounded-xl bg-secondary/60 p-1">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(o.value)}
            className={cn(
              'flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
              on
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
