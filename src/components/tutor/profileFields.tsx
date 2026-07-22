import { useState } from 'react';
import { Check, Plus, Trash2, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { SessionMode } from '@/types';
import type { Course } from '@/services/authService';
import { MODE_OPTIONS, EMPTY_ROW, type CredentialRow } from './profileFieldOptions';

/* Shared building blocks for tutor profile data — used by both the onboarding
   wizard (TutorProfileCreatePage) and the dashboard editor (ProfileSettings).
   Option constants & types live in ./profileFieldOptions. */

export function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="font-display text-base font-bold">{title}</h2>
      {hint && <span className="text-xs font-normal text-muted-foreground">· {hint}</span>}
    </div>
  );
}

export function Field({
  label,
  icon: Icon,
  hint,
  error,
  required,
  counter,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  hint?: string;
  error?: string;
  /** Adds a red asterisk after the label. */
  required?: boolean;
  /** Right-aligned character counter, e.g. "45/100". */
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          {label}
          {required && (
            <span className="text-red-500" aria-hidden="true" title="Required">
              *
            </span>
          )}
        </Label>
        {counter && <span className="text-[11px] tabular-nums text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-input bg-background text-foreground/80 hover:border-brand-300',
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ModeToggles({
  selected,
  onToggle,
  options = MODE_OPTIONS,
}: {
  selected: SessionMode[];
  onToggle: (value: SessionMode) => void;
  options?: { value: SessionMode; label: string; icon: LucideIcon }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((m) => {
        const active = selected.includes(m.value);
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onToggle(m.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'border-input text-muted-foreground hover:border-brand-200',
            )}
          >
            <m.icon className="h-4 w-4" /> {m.label}
          </button>
        );
      })}
    </div>
  );
}

export function CredentialEditor({
  rows,
  onChange,
  titlePlaceholder,
  orgPlaceholder,
}: {
  rows: CredentialRow[];
  onChange: (rows: CredentialRow[]) => void;
  titlePlaceholder: string;
  orgPlaceholder: string;
}) {
  const update = (i: number, patch: Partial<CredentialRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, { ...EMPTY_ROW }]);

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex flex-wrap items-start gap-2 rounded-xl border bg-secondary/30 p-3"
        >
          <Input
            value={row.title}
            onChange={(e) => update(i, { title: e.target.value })}
            placeholder={titlePlaceholder}
            className="min-w-[180px] flex-1"
          />
          <Input
            value={row.org}
            onChange={(e) => update(i, { org: e.target.value })}
            placeholder={orgPlaceholder}
            className="min-w-[160px] flex-1"
          />
          <Input
            value={row.year}
            onChange={(e) => update(i, { year: e.target.value })}
            placeholder="Year"
            className="w-24"
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Remove"
            onClick={() => remove(i)}
            className="shrink-0 text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4" /> Add {rows.length ? 'another' : 'one'}
      </Button>
    </div>
  );
}

/**
 * Courses editor: the tutor types a code + title and clicks Add — it appears as a chip and the inputs
 * clear, ready for the next. Chips are removable. Matches the WhatsApp-style "add many" flow.
 */
export function CoursesEditor({
  courses,
  onChange,
}: {
  courses: Course[];
  onChange: (courses: Course[]) => void;
}) {
  const [abbr, setAbbr] = useState('');
  const [title, setTitle] = useState('');

  const add = () => {
    const a = abbr.trim();
    const t = title.trim();
    if (!a || !t) return;
    onChange([...courses, { abbreviation: a, title: t }]);
    setAbbr('');
    setTitle('');
  };
  const remove = (i: number) => onChange(courses.filter((_, idx) => idx !== i));
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-3">
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {courses.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border bg-secondary/40 py-1 pl-3 pr-1.5 text-sm"
            >
              <span className="font-semibold text-brand-700 dark:text-brand-400">{c.abbreviation}</span>
              <span className="text-muted-foreground">{c.title}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${c.abbreviation}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={abbr}
          onChange={(e) => setAbbr(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Code (e.g. CS101)"
          className="w-36"
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Course title (e.g. Intro to Programming)"
          className="min-w-[200px] flex-1"
        />
        <Button variant="outline" size="sm" onClick={add} disabled={!abbr.trim() || !title.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
