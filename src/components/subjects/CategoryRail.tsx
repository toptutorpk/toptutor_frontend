import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatCompact } from '@/lib/utils';
import { DynamicIcon } from '@/lib/icons';
import type { SubjectCategory } from '@/services/subjectCatalogService';

/** The pseudo-category for "no filter". Not a row in the database, so it has no id. */
export const ALL_CATEGORIES = 'all';

interface CategoryRailProps {
  categories: SubjectCategory[];
  /** A category slug, or {@link ALL_CATEGORIES}. */
  value: string;
  onChange: (slug: string) => void;
  totalSubjects: number;
  totalTutors: number;
}

/**
 * A single horizontal row of category chips that scrolls sideways.
 *
 * <p>A row rather than a wrapping block because there are eighteen categories and the count grows:
 * wrapped, they push the subject grid below the fold on a laptop and read as a wall of buttons
 * rather than as a choice. Scrolling sideways keeps the grid where the eye already is.
 *
 * <p>The arrows are an addition to native scrolling, not a replacement for it — the rail stays
 * swipeable on a touchpad or phone, and each is hidden when there is nothing further that way, so a
 * dead control is never offered. Below `sm` the arrows are dropped entirely: a thumb swipe is the
 * natural gesture there, and the buttons would only eat width.
 */
export function CategoryRail({
  categories,
  value,
  onChange,
  totalSubjects,
  totalTutors,
}: CategoryRailProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // A pixel of slack: fractional scroll positions on zoomed or hi-dpi displays otherwise leave
    // scrollLeft a hair short of the true end, and the right arrow never turns off.
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    syncEdges();
    // Also on resize: a window wide enough to show every chip has no overflow, and both arrows
    // should disappear rather than linger as decoration.
    const observer = new ResizeObserver(syncEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncEdges, categories.length]);

  const scrollBy = (direction: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    // Most of a screenful, not all of it: leaving a chip or two visible keeps the reader's place
    // instead of replacing the whole row with unfamiliar labels.
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <ArrowButton side="left" hidden={atStart} onClick={() => scrollBy(-1)} />
      <ArrowButton side="right" hidden={atEnd} onClick={() => scrollBy(1)} />

      {/* Fades signal "there is more this way" even while the arrows are out of reach on touch.
          Pointer-events-none so they never swallow a click meant for the chip underneath. */}
      <Fade side="left" hidden={atStart} />
      <Fade side="right" hidden={atEnd} />

      <div
        ref={scroller}
        onScroll={syncEdges}
        className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth px-1 py-2 sm:px-10"
      >
        <Chip
          icon="Sparkles"
          gradient="from-brand-500 to-brand-700"
          label="All Subjects"
          meta={`${formatCompact(totalSubjects)} subjects · ${formatCompact(totalTutors)} tutors`}
          selected={value === ALL_CATEGORIES}
          onClick={() => onChange(ALL_CATEGORIES)}
        />
        {categories.map((category) => (
          <Chip
            key={category.slug}
            icon={category.icon}
            gradient={category.gradient}
            label={category.name}
            meta={`${formatCompact(category.subjects.length)} subjects · ${formatCompact(category.tutorCount)} tutors`}
            selected={value === category.slug}
            onClick={() => onChange(category.slug)}
          />
        ))}
      </div>
    </div>
  );
}

interface ChipProps {
  icon: string;
  gradient: string;
  label: string;
  meta: string;
  selected: boolean;
  onClick: () => void;
}

function Chip({ icon, gradient, label, meta, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      // shrink-0 is what makes the row scroll instead of squashing eighteen chips to slivers.
      className={cn(
        'group flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200',
        selected
          ? 'border-brand-500 bg-brand-50 shadow-soft dark:bg-brand-500/10'
          : 'hover:border-brand-300 hover:bg-secondary/60',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm transition-transform duration-200 group-hover:scale-105',
          gradient,
        )}
      >
        <DynamicIcon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            'whitespace-nowrap text-sm font-semibold leading-tight',
            selected && 'text-brand-700 dark:text-brand-300',
          )}
        >
          {label}
        </span>
        <span className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">
          {meta}
        </span>
      </span>
    </button>
  );
}

function ArrowButton({
  side,
  hidden,
  onClick,
}: {
  side: 'left' | 'right';
  hidden: boolean;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      // Hidden from assistive tech as well as from view: the rail is already reachable by keyboard
      // through the chips themselves, so an arrow in the tab order is a second way to do nothing new.
      aria-hidden
      tabIndex={-1}
      className={cn(
        'absolute top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-opacity duration-200 hover:bg-secondary sm:flex',
        side === 'left' ? 'left-0' : 'right-0',
        hidden && 'pointer-events-none opacity-0',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Fade({ side, hidden }: { side: 'left' | 'right'; hidden: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10 w-12 transition-opacity duration-200',
        side === 'left'
          ? 'left-0 bg-gradient-to-r from-background to-transparent'
          : 'right-0 bg-gradient-to-l from-background to-transparent',
        hidden && 'opacity-0',
      )}
    />
  );
}
