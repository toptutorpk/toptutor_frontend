import { useMemo, useState } from 'react';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubjectCategoryIndex, useSubjectGroups } from '@/hooks/useCatalogs';

interface Props {
  selected: string[];
  onChange: (subjects: string[]) => void;
  /**
   * Lets the picker accept a subject the catalogue does not have.
   *
   * <p>Off for tutors, who teach from the public taxonomy and whose subjects drive search. On for
   * institutes, which hire for roles the taxonomy does not carry — "Quran &amp; Tajweed", a
   * board-specific paper, a Montessori post. Their free text is stored against the job rather
   * than added to the catalogue, so the public list stays curated.
   */
  allowCustom?: boolean;
  /** Longest a custom subject may be; matches the column the server stores it in. */
  maxCustomLength?: number;
}

/**
 * Pick subjects by narrowing to a category first.
 *
 * <p>Replaces a flat wall of chips. That worked at ten subjects and collapses at three hundred:
 * finding one meant reading the whole list, and the block pushed the rest of the form off screen.
 *
 * <p>The category is a lens, not a property of the tutor. Nothing about it is saved — switching
 * categories re-filters the list and leaves the selection alone, so a tutor can collect subjects
 * from as many categories as they teach. The chips carry their category with them precisely
 * because the list above has moved on by then, and "Geography" alone does not say where it came
 * from.
 *
 * <p>Nothing is picked to start: a category has to be chosen before the subject list means
 * anything, so the subject control stays disabled until then rather than silently offering every
 * subject in the catalogue.
 */
export function SubjectPicker({
  selected,
  onChange,
  allowCustom = false,
  maxCustomLength = 100,
}: Props) {
  const groups = useSubjectGroups();
  const categoryOf = useSubjectCategoryIndex();
  const [category, setCategory] = useState<string>('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const visible = useMemo(() => {
    const scoped = groups.filter((g) => g.category === category);
    const needle = query.trim().toLowerCase();
    if (!needle) return scoped;
    // Search spans the visible categories rather than only the chosen one, so a tutor who types
    // "python" without first finding the right category still lands on it.
    return scoped
      .map((g) => ({ ...g, subjects: g.subjects.filter((s) => s.toLowerCase().includes(needle)) }))
      .filter((g) => g.subjects.length > 0);
  }, [groups, category, query]);

  const toggle = (subject: string) => {
    onChange(
      selected.includes(subject)
        ? selected.filter((s) => s !== subject)
        : [...selected, subject],
    );
  };

  const matchCount = visible.reduce((n, g) => n + g.subjects.length, 0);

  /**
   * Adds a typed subject.
   *
   * <p>Case-insensitive against both the catalogue and what is already picked, so typing
   * "physics" when "Physics" exists selects the catalogue entry instead of creating a near-
   * duplicate the server would then store as free text.
   */
  const addCustom = () => {
    const value = custom.trim().replace(/\s+/g, ' ');
    if (!value) return;

    const known = groups
      .flatMap((g) => g.subjects)
      .find((s) => s.toLowerCase() === value.toLowerCase());
    const name = known ?? value;

    if (selected.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setCustom('');
      return;
    }
    onChange([...selected, name]);
    setCustom('');
  };

  const customTooLong = custom.trim().length > maxCustomLength;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Category
          </Label>
          <Select
            value={category || undefined}
            onValueChange={(v) => {
              setCategory(v);
              setQuery('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.category} value={g.category}>
                  {g.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Subject
          </Label>
          {/* A popover rather than a native multi-select: the list has to stay open across several
              picks, show which are already chosen, and be searchable. Disabled until a category is
              chosen — the list only means something once it has been narrowed. */}
          <Popover open={open && !!category} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={!category}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-muted-foreground">
                  {category ? 'Select subjects' : 'Select a category first'}
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
                {matchCount === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No subjects match “{query}”.
                  </p>
                ) : (
                  visible.map((group) => (
                    <div key={group.category} className="mb-1 last:mb-0">
                      {/* The heading stays even when one category is selected — it is what makes a
                          list of bare subject names legible. */}
                      <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {group.category}
                      </p>
                      {group.subjects.map((subject) => {
                        const active = selected.includes(subject);
                        return (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => toggle(subject)}
                            aria-pressed={active}
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
        </div>
      </div>

      {/* Free text, for a role the catalogue does not name. Deliberately below the catalogue
          controls: it is the fallback, and offering it first would invite typed duplicates of
          subjects that already exist. */}
      {allowCustom && (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Not listed?
          </Label>
          <div className="flex gap-2">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the subject; without this it submits the surrounding form instead,
                // saving the post with the typed subject still sitting in the box.
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Add your own, e.g. Quran & Tajweed"
              aria-invalid={customTooLong}
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustom}
              disabled={!custom.trim() || customTooLong}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <p className={cn('text-xs', customTooLong ? 'text-destructive' : 'text-muted-foreground')}>
            {customTooLong
              ? `Keep it under ${maxCustomLength} characters.`
              : 'Used on this post only — it is not added to the public subject list.'}
          </p>
        </div>
      )}

      {/* Chips sit directly under the controls, styled like the course chips below them, so the
          two "add many" blocks in this card read as one pattern rather than two designs. */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((subject) => (
            <div
              key={subject}
              className="flex items-center gap-2 rounded-md border bg-secondary/40 py-1 pl-3 pr-1.5 text-sm"
            >
              <span className="font-semibold text-brand-700 dark:text-brand-400">{subject}</span>
              <span className="text-muted-foreground">{categoryOf[subject] ?? 'Custom'}</span>
              <button
                type="button"
                onClick={() => toggle(subject)}
                aria-label={`Remove ${subject}`}
                className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
