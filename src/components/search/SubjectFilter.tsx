import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSubjectCategoryIndex, useSubjectGroups } from '@/hooks/useCatalogs';

interface Props {
  value?: string;
  onChange: (subject: string | undefined) => void;
}

/**
 * Single-subject filter, grouped by category and searchable.
 *
 * <p>A plain dropdown of three hundred subjects asks the reader to scroll past everything they are
 * not looking for. Grouping restores the shape of the list, and the search box means a student who
 * knows the subject's name never has to find its category at all.
 *
 * <p>Deliberately not the tutor's multi-select: a student filters to one subject at a time, and
 * offering several here would raise a question the results have no answer for (all of them, or any
 * of them?).
 */
export function SubjectFilter({ value, onChange }: Props) {
  const groups = useSubjectGroups();
  const categoryOf = useSubjectCategoryIndex();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((g) => ({ ...g, subjects: g.subjects.filter((s) => s.toLowerCase().includes(needle)) }))
      .filter((g) => g.subjects.length > 0);
  }, [groups, query]);

  const pick = (subject: string | undefined) => {
    onChange(subject);
    setOpen(false);
    setQuery('');
  };

  const matchCount = visible.reduce((n, g) => n + g.subjects.length, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-[var(--radius-btn)] border bg-background px-3 text-sm"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? (
              <>
                <span className="text-muted-foreground">{categoryOf[value] ?? 'Other'} › </span>
                {value}
              </>
            ) : (
              'Any subject'
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects…"
              className="h-9 pl-8"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => pick(undefined)}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              !value ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/10' : 'hover:bg-secondary',
            )}
          >
            Any subject
            {!value && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>

          {matchCount === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No subjects match “{query}”.
            </p>
          ) : (
            visible.map((group) => (
              <div key={group.category} className="mb-1 last:mb-0">
                <p className="flex items-center justify-between px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {group.category}
                  <span className="font-medium tabular-nums opacity-70">{group.subjects.length}</span>
                </p>
                {group.subjects.map((subject) => {
                  const active = subject === value;
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => pick(subject)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                        active
                          ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'hover:bg-secondary',
                      )}
                    >
                      {subject}
                      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
