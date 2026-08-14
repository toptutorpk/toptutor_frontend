import { useEffect, useMemo, useRef, useState } from 'react';
import { Video, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  formatDuration,
  formatTime,
  toMinutes,
  type CalendarDay,
  type CalendarEntry,
} from '@/services/availabilityService';

/** Pixels per hour. Tall enough that a 30-minute block still fits a legible label. */
const HOUR_PX = 64;
/** The grid always covers at least the working day, so an empty week still looks like a calendar. */
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 22;

interface Props {
  days: CalendarDay[];
  /** "Now" in the business timezone, from the server — the anchor for the current-time line. */
  serverNow: string;
  onJoin: (entry: CalendarEntry) => void;
  className?: string;
}

/**
 * The dated schedule grid: hours down the side, one column per day, blocks positioned by time.
 *
 * <p>Renders whatever days it is handed — seven for the week view, one for the day view — so the two
 * views share all their geometry and only differ in how many columns they carry.
 */
export function ScheduleCalendar({ days, serverNow, onJoin, className }: Props) {
  const nowMinutes = useServerClock(serverNow);
  const { startHour, endHour } = useGridBounds(days);
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );
  const gridStart = startHour * 60;
  const gridHeight = (endHour - startHour) * HOUR_PX;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open on the current hour rather than at 7am — a tutor checking their afternoon shouldn't have
  // to scroll past a dead morning to find it.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = ((nowMinutes - gridStart) / 60) * HOUR_PX - HOUR_PX * 1.5;
    // Ceiling read off the element rather than computed from gridHeight: the
    // scrollable content is the headings plus the grid, so deriving it keeps
    // this correct without the header's height having to be known here.
    el.scrollTop = Math.max(0, Math.min(offset, el.scrollHeight - el.clientHeight));
    // Only on mount / when the visible span changes — never fight the user's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart, gridHeight]);

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-soft', className)}>
      <div ref={scrollRef} className="max-h-[32rem] overflow-y-auto">
        {/* Day headings sit INSIDE the scroller and stick to its top.
            Placed outside it, they measure a scrollbar's width wider than the
            columns beneath them, and seven flex-1 columns split that surplus
            cumulatively — square over Monday, and a full scrollbar adrift by
            Sunday. Sharing the scroller's content box removes the difference at
            source rather than compensating for it.

            The wrapper carries the card colour so the row is opaque: the tint
            alone is translucent, and entries would show through it as they
            scroll underneath. z-30 clears the entry blocks (z-10) and the
            current-time line (z-20). */}
        <div className="sticky top-0 z-30 bg-card">
          <div className="flex border-b bg-secondary/30">
            <div className="w-14 shrink-0 sm:w-16" />
            {days.map((day) => (
              <DayHeading key={day.date} day={day} single={days.length === 1} />
            ))}
          </div>
        </div>

        <div className="flex" style={{ height: gridHeight }}>
          {/* Hour gutter.

              Each label sits just below the line that opens its hour, wholly
              inside its own band, rather than straddling that line. Straddling
              reads well mid-grid but breaks at both ends: the first label hung
              above the top of the scrollable content, where nothing can bring
              it back into view, and the viewport is an exact multiple of
              HOUR_PX, so its lower edge also lands on a line and bisected the
              last label too. Keeping each label inside its band means no edge
              can ever cut one in half. */}
          <div className="w-14 shrink-0 sm:w-16">
            {hours.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_PX }}>
                <span className="absolute right-2 top-1 text-[11px] tabular-nums text-muted-foreground">
                  {formatTime(`${String(h).padStart(2, '0')}:00`)}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={day.date}
              className={cn(
                'relative flex-1 border-l',
                day.today && 'bg-brand-50/40 dark:bg-brand-500/5',
                day.past && 'bg-muted/30',
              )}
            >
              {hours.map((h) => (
                <div key={h} className="border-b border-dashed border-border/60" style={{ height: HOUR_PX }} />
              ))}

              {day.entries.map((entry) => (
                <EntryBlock
                  key={`${entry.weeklySlotId}-${entry.start}`}
                  entry={entry}
                  gridStart={gridStart}
                  compact={days.length > 1}
                  onJoin={onJoin}
                />
              ))}

              {day.today && <NowLine nowMinutes={nowMinutes} gridStart={gridStart} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayHeading({ day, single }: { day: CalendarDay; single: boolean }) {
  const date = new Date(`${day.date}T00:00:00`);
  return (
    <div className={cn('flex-1 border-l px-2 py-2 text-center', day.past && 'opacity-60')}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {single ? day.dayOfWeek.charAt(0) + day.dayOfWeek.slice(1).toLowerCase() : day.dayOfWeek.slice(0, 3)}
      </p>
      <p
        className={cn(
          'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
          day.today ? 'bg-brand-600 text-white' : 'text-foreground',
        )}
      >
        {date.getDate()}
      </p>
    </div>
  );
}

/** The red line marking the present moment — only ever drawn on today's column. */
function NowLine({ nowMinutes, gridStart }: { nowMinutes: number; gridStart: number }) {
  const top = ((nowMinutes - gridStart) / 60) * HOUR_PX;
  if (top < 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top }}>
      <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
      <span className="h-px flex-1 bg-red-500" />
    </div>
  );
}

function EntryBlock({
  entry,
  gridStart,
  compact,
  onJoin,
}: {
  entry: CalendarEntry;
  gridStart: number;
  compact: boolean;
  onJoin: (entry: CalendarEntry) => void;
}) {
  const start = toMinutes(entry.start);
  const minutes = toMinutes(entry.end) - start;
  const top = ((start - gridStart) / 60) * HOUR_PX;
  const height = (minutes / 60) * HOUR_PX;
  const roomy = height >= 52;

  return (
    <div
      className={cn(
        'absolute inset-x-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-left',
        STYLES[entry.status],
        entry.past && 'opacity-50',
      )}
      style={{ top, height: Math.max(height - 2, 20) }}
      title={`${formatTime(entry.start)} – ${formatTime(entry.end)} · ${LABELS[entry.status]}`}
    >
      <p className="truncate text-[11px] font-semibold leading-tight tabular-nums">
        {formatTime(entry.start)}
        {roomy && ` – ${formatTime(entry.end)}`}
      </p>

      {entry.status === 'BOOKED' ? (
        <p className="truncate text-[11px] leading-tight">
          {entry.studentName ?? 'Student'}
          {entry.paid === false && ' · unpaid'}
        </p>
      ) : (
        roomy && (
          <p className="truncate text-[11px] leading-tight opacity-80">
            {entry.status === 'UNAVAILABLE' && entry.note ? entry.note : LABELS[entry.status]}
            {entry.status === 'AVAILABLE' && !compact && ` · ${formatDuration(minutes)}`}
          </p>
        )
      )}

      {entry.joinable && (
        <Button
          size="sm"
          variant="gradient"
          className="mt-1 h-6 w-full px-2 text-[11px]"
          onClick={() => onJoin(entry)}
        >
          <Video className="h-3 w-3" /> Join
        </Button>
      )}

      {entry.status === 'BLOCKED' && !roomy && <Lock className="absolute right-1 top-1 h-3 w-3 opacity-70" />}
    </div>
  );
}

const STYLES: Record<CalendarEntry['status'], string> = {
  AVAILABLE:
    'border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  BOOKED:
    'border-brand-300 bg-brand-100 text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-100',
  BLOCKED:
    'border-border bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(120,120,120,0.18)_4px,rgba(120,120,120,0.18)_8px)] text-muted-foreground',
  UNAVAILABLE:
    'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300',
};

const LABELS: Record<CalendarEntry['status'], string> = {
  AVAILABLE: 'Open',
  BOOKED: 'Booked',
  BLOCKED: 'Too short to book',
  UNAVAILABLE: 'Unavailable',
};

/**
 * Minutes since midnight, seeded from the SERVER's clock and ticked forward locally.
 *
 * <p>The starting point comes from the server so the line lands correctly for a tutor whose device is
 * in another timezone or simply wrong; only the elapsed time since the page loaded is measured
 * locally, which no clock can get meaningfully wrong.
 */
function useServerClock(serverNow: string): number {
  const [anchor] = useState(() => ({
    serverMinutes: minutesOfDay(serverNow),
    mountedAt: Date.now(),
  }));
  const [minutes, setMinutes] = useState(anchor.serverMinutes);

  useEffect(() => {
    const tick = () =>
      setMinutes(anchor.serverMinutes + Math.floor((Date.now() - anchor.mountedAt) / 60000));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [anchor]);

  return minutes;
}

/** '2026-08-10T14:35:02' → 875. */
function minutesOfDay(isoLocalDateTime: string): number {
  const time = isoLocalDateTime.split('T')[1] ?? '00:00';
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Fits the grid to the tutor's actual hours, never smaller than a normal working day. */
function useGridBounds(days: CalendarDay[]) {
  return useMemo(() => {
    let earliest = DEFAULT_START_HOUR * 60;
    let latest = DEFAULT_END_HOUR * 60;
    for (const day of days) {
      for (const entry of day.entries) {
        earliest = Math.min(earliest, toMinutes(entry.start));
        latest = Math.max(latest, toMinutes(entry.end));
      }
    }
    return {
      startHour: Math.floor(earliest / 60),
      endHour: Math.min(24, Math.ceil(latest / 60)),
    };
  }, [days]);
}
