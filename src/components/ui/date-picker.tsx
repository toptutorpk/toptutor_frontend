import * as React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * A date field with our own calendar, replacing `<input type="date">`.
 *
 * <p>The native control was the problem: every browser draws its own, none of them take the app's
 * theme, and Chrome's in particular reads as a piece of the operating system dropped into the page.
 * It also cannot be styled in dark mode, so the one field on a dark form flashed a white panel.
 *
 * <p>Reaching a date years in the past is the case this is built around — a CNIC issue date is
 * rarely in the current month. Rather than making someone click a chevron thirty times, the caption
 * drills down: month grid → month picker → year picker, so any date within a decade is three
 * clicks away, and paging in the year view moves twelve years at a time.
 *
 * <p>The value contract matches the input it replaces — an ISO {@code yyyy-MM-dd} string, empty when
 * nothing is chosen — so a form holding one of these needs no other change.
 */
export interface DatePickerProps {
  /** ISO `yyyy-MM-dd`, or `''` for no selection. */
  value: string;
  onChange: (next: string) => void;
  /** Selectable bounds, ISO `yyyy-MM-dd`. Days outside them are shown but not clickable. */
  min?: string;
  max?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Shown under the grid — room for the one line of guidance the field needs. */
  hint?: string;
}

const ISO = 'yyyy-MM-dd';
/** Monday-first, matching the tutor schedule grid elsewhere in the app. */
const WEEK_STARTS_ON = 1 as const;
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
/** Years shown at once. Twelve fills a 3×4 grid and pages a comfortable span at a time. */
const YEARS_PER_PAGE = 12;
/** Six rows always, so the panel never changes height as the months are paged. */
const DAY_CELLS = 42;

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  id,
  placeholder = 'Select a date',
  disabled,
  invalid,
  className,
  hint,
}: DatePickerProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const selected = parseDate(value);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const clamp = React.useCallback(
    (date: Date) => {
      if (minDate && isBefore(date, minDate)) return minDate;
      if (maxDate && isAfter(date, maxDate)) return maxDate;
      return date;
    },
    [minDate, maxDate],
  );
  const outOfRange = React.useCallback(
    (date: Date) => Boolean((minDate && isBefore(date, minDate)) || (maxDate && isAfter(date, maxDate))),
    [minDate, maxDate],
  );

  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days');
  // The month on screen, and the day the arrow keys are sitting on. Kept apart because they move
  // independently: paging changes the month without moving the selection, and stepping off the end
  // of a month moves the day and drags the month along with it.
  const [cursor, setCursor] = React.useState(() => startOfMonth(selected ?? clamp(today)));
  const [focused, setFocused] = React.useState(() => selected ?? clamp(today));
  const gridRef = React.useRef<HTMLDivElement>(null);

  // Reopening lands back on the chosen date rather than wherever the last visit was left. Someone
  // correcting a typo expects to see the date they are correcting, not a stale month.
  React.useEffect(() => {
    if (!open) return;
    const anchor = selected ?? clamp(today);
    setView('days');
    setCursor(startOfMonth(anchor));
    setFocused(anchor);
    // Only when the panel opens: re-running as `selected` changes would fight the arrow keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Follow the roving tabindex with real focus, so the screen reader announces each day as the
  // arrow keys walk the grid rather than staying silent on the container.
  React.useEffect(() => {
    if (!open || view !== 'days') return;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  }, [open, view, focused]);

  // Grouped into weeks rather than one flat run of 42: an ARIA grid is rows of cells, and a grid
  // whose cells are not in rows is not navigable by a screen reader's table commands. The row
  // elements carry `contents` so they add the semantics without adding a box to the CSS grid.
  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON });
    const all = Array.from({ length: DAY_CELLS }, (_, i) => addDays(start, i));
    return Array.from({ length: DAY_CELLS / 7 }, (_, w) => all.slice(w * 7, w * 7 + 7));
  }, [cursor]);

  const yearPageStart = Math.floor(cursor.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE;

  /** How far one press of the header arrows moves, in months, for the view on screen. */
  const step = view === 'days' ? 1 : view === 'months' ? 12 : YEARS_PER_PAGE * 12;
  const prevCursor = addMonths(cursor, -step);
  const nextCursor = addMonths(cursor, step);
  // An arrow is live if any date on the page it lands on is selectable, so the span has to be
  // measured from the page's own edges — not from the cursor, which sits at an arbitrary point
  // inside it. Checking the cursor instead refuses a page that is only partly out of range: from
  // December 2025, with the maximum in August 2026, "next year" lands on December 2026 and looks
  // out of bounds even though the first eight months of that page are perfectly selectable.
  const pageBounds = (date: Date): [Date, Date] => {
    if (view === 'days') return [startOfMonth(date), endOfMonth(date)];
    if (view === 'months') return [new Date(date.getFullYear(), 0, 1), new Date(date.getFullYear(), 11, 31)];
    const first = Math.floor(date.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    return [new Date(first, 0, 1), new Date(first + YEARS_PER_PAGE - 1, 11, 31)];
  };
  const canGoPrev = !minDate || !isBefore(pageBounds(prevCursor)[1], minDate);
  const canGoNext = !maxDate || !isAfter(pageBounds(nextCursor)[0], maxDate);

  const select = (date: Date) => {
    onChange(format(date, ISO));
    setOpen(false);
  };

  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const byDay: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: Date | null = null;
    if (e.key in byDay) next = addDays(focused, byDay[e.key]);
    else if (e.key === 'PageUp') next = e.shiftKey ? addYears(focused, -1) : addMonths(focused, -1);
    else if (e.key === 'PageDown') next = e.shiftKey ? addYears(focused, 1) : addMonths(focused, 1);
    else if (e.key === 'Home') next = startOfWeek(focused, { weekStartsOn: WEEK_STARTS_ON });
    else if (e.key === 'End') next = addDays(startOfWeek(focused, { weekStartsOn: WEEK_STARTS_ON }), 6);
    if (!next) return;

    e.preventDefault();
    const landed = clamp(next);
    setFocused(landed);
    if (!isSameMonth(landed, cursor)) setCursor(startOfMonth(landed));
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            // Deliberately the same geometry and border treatment as <Input>, so this sits in a
            // form beside text fields without announcing itself as a different kind of control.
            'group flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input',
            'bg-background px-3.5 py-2 text-left text-sm shadow-sm transition-colors',
            'hover:border-brand-300 dark:hover:border-brand-500/50',
            'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            'data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-offset-1 data-[state=open]:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500',
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? format(selected, 'd MMMM yyyy') : placeholder}
          </span>
          <CalendarDays
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-colors',
              'group-hover:text-brand-600 group-data-[state=open]:text-brand-600 dark:group-hover:text-brand-400 dark:group-data-[state=open]:text-brand-400',
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[19.5rem] p-0 shadow-soft"
        // Radix would focus the panel itself; the grid wants the focus so the arrow keys work the
        // moment it opens, and our own effect puts it on the right day.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1 border-b p-2.5">
          <NavButton
            label={view === 'days' ? 'Previous month' : view === 'months' ? 'Previous year' : 'Earlier years'}
            disabled={!canGoPrev}
            onClick={() => setCursor(prevCursor)}
          >
            <ChevronLeft className="h-4 w-4" />
          </NavButton>

          {/* The caption is the drill-down. Making the heading itself the control keeps the fast
              path where the eye already is, instead of hiding it behind a separate affordance. */}
          <button
            type="button"
            onClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 font-display text-sm font-bold tracking-tight transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-live="polite"
          >
            {view === 'days' && format(cursor, 'MMMM yyyy')}
            {view === 'months' && format(cursor, 'yyyy')}
            {view === 'years' && `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`}
          </button>

          <NavButton
            label={view === 'days' ? 'Next month' : view === 'months' ? 'Next year' : 'Later years'}
            disabled={!canGoNext}
            onClick={() => setCursor(nextCursor)}
          >
            <ChevronRight className="h-4 w-4" />
          </NavButton>
        </div>

        <div className="p-2.5">
          {view === 'days' && (
            <>
              <div className="mb-1 grid grid-cols-7">
                {/* Two letters, not one: a column of M T W T F S S makes the reader count across
                    to tell Tuesday from Thursday. The day buttons carry the full weekday name in
                    their label, so this row is for the eye only. */}
                {WEEKDAYS.map((day) => (
                  <abbr
                    key={day}
                    title={day}
                    className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground no-underline"
                  >
                    {day.slice(0, 2)}
                  </abbr>
                ))}
              </div>

              <div
                ref={gridRef}
                role="grid"
                aria-label="Calendar"
                onKeyDown={onGridKeyDown}
                className="grid grid-cols-7 gap-y-0.5"
              >
                {weeks.map((week) => (
                  <div key={week[0].getTime()} role="row" className="contents">
                    {week.map((day) => {
                      const isOutside = !isSameMonth(day, cursor);
                      const isDisabled = outOfRange(day);
                      const isSelected = Boolean(selected && isSameDay(day, selected));
                      const isToday = isSameDay(day, today);
                      return (
                        <button
                          key={day.getTime()}
                          type="button"
                          role="gridcell"
                          aria-selected={isSelected}
                          aria-current={isToday ? 'date' : undefined}
                          aria-label={format(day, 'EEEE d MMMM yyyy')}
                          // One stop in the tab order for the whole grid — the arrow keys move
                          // within it, so Tab does not have to walk forty-two buttons to leave.
                          tabIndex={isSameDay(day, focused) ? 0 : -1}
                          data-focused={isSameDay(day, focused) || undefined}
                          disabled={isDisabled}
                          onClick={() => select(day)}
                          className={cn(
                            'relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            !isSelected && !isDisabled && 'hover:bg-secondary',
                            isOutside && !isSelected && 'text-muted-foreground/40',
                            isDisabled && 'cursor-not-allowed text-muted-foreground/25 hover:bg-transparent',
                            isToday && !isSelected && !isDisabled && 'font-bold text-brand-600 dark:text-brand-400',
                            isSelected &&
                              'bg-gradient-to-br from-brand-600 to-brand-500 font-semibold text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.65)] hover:brightness-105',
                          )}
                        >
                          {day.getDate()}
                          {/* Today keeps a mark even when it is the selection, so the grid never
                              loses its one fixed reference point. */}
                          {isToday && (
                            <span
                              className={cn(
                                'absolute bottom-1 h-1 w-1 rounded-full',
                                isSelected ? 'bg-white/80' : 'bg-brand-500',
                                isDisabled && 'bg-muted-foreground/30',
                              )}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'months' && (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((label, index) => {
                const month = new Date(cursor.getFullYear(), index, 1);
                // Disabled only when the whole month is out of bounds — the boundary month itself
                // still holds selectable days.
                const isDisabled =
                  (minDate && isBefore(endOfMonth(month), minDate)) ||
                  (maxDate && isAfter(startOfMonth(month), maxDate));
                const isCurrent = selected
                  ? isSameMonth(month, selected)
                  : index === cursor.getMonth() && cursor.getFullYear() === today.getFullYear();
                return (
                  <PanelCell
                    key={label}
                    active={Boolean(isCurrent)}
                    disabled={Boolean(isDisabled)}
                    onClick={() => {
                      setCursor(month);
                      setView('days');
                    }}
                  >
                    {label}
                  </PanelCell>
                );
              })}
            </div>
          )}

          {view === 'years' && (
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i).map((year) => {
                const isDisabled =
                  (minDate && year < minDate.getFullYear()) || (maxDate && year > maxDate.getFullYear());
                return (
                  <PanelCell
                    key={year}
                    active={selected ? selected.getFullYear() === year : year === today.getFullYear()}
                    disabled={Boolean(isDisabled)}
                    onClick={() => {
                      setCursor(new Date(year, cursor.getMonth(), 1));
                      setView('months');
                    }}
                  >
                    {year}
                  </PanelCell>
                );
              })}
            </div>
          )}
        </div>

        {hint && (
          <p className="border-t px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** One tile in the month or year grid — the two share every style but their contents. */
function PanelCell({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !active && !disabled && 'hover:bg-secondary',
        disabled && 'cursor-not-allowed text-muted-foreground/25',
        active &&
          'bg-gradient-to-br from-brand-600 to-brand-500 font-semibold text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.65)] hover:brightness-105',
      )}
    >
      {children}
    </button>
  );
}
