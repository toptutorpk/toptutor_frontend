import { useEffect, useMemo, useRef, useState } from 'react';
import { Video, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RestHoursBand, RestHoursPanel } from '@/components/schedule/RestHoursBand';
import {
  formatDuration,
  formatTime,
  toMinutes,
  type CalendarDay,
  type CalendarEntry,
} from '@/services/availabilityService';

/** Pixels per hour. Tall enough that a 30-minute block still fits a legible label. */
const HOUR_PX = 64;
/**
 * The grid always covers the whole teaching day, so an empty week still looks like a calendar — and
 * so a tutor can see that 6am is theirs to sell without hunting for it.
 *
 * <p>It runs to 24 rather than stopping at 23:30 so the closing edge is drawn as a closed band
 * rather than simply being where the calendar happens to stop.
 */
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 24;

/**
 * TopTutor's teaching hours, in minutes from midnight — 06:00 to 23:30.
 *
 * <p>Mirrors `toptutor.booking.day-start` / `day-end`, which the server enforces. Used here only to
 * mark the closed hours, never to hide anything: a session booked before the hours narrowed still
 * has to be visible to the person who has to turn up to it.
 */
const TEACHING_START = 6 * 60;
const TEACHING_END = 23 * 60 + 30;

interface Props {
  days: CalendarDay[];
  /** "Now" in the business timezone, from the server — the anchor for the current-time line. */
  serverNow: string;
  onJoin: (entry: CalendarEntry) => void;
  /** Fired when the clock crosses midnight, so the page can refetch a day that is now yesterday. */
  onDayRollover?: () => void;
  className?: string;
}

/**
 * The dated schedule grid: hours down the side, one column per day, blocks positioned by time.
 *
 * <p>Renders whatever days it is handed — seven for the week view, one for the day view — so the two
 * views share all their geometry and only differ in how many columns they carry.
 */
export function ScheduleCalendar({ days, serverNow, onJoin, onDayRollover, className }: Props) {
  const nowMinutes = useServerClock(serverNow, onDayRollover);
  const { startHour, endHour } = useGridBounds(days, nowMinutes);
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
    // `isolate` gives the card its own stacking context, and that is load-bearing rather than
    // decorative. The day headings below are sticky at z-30 so they clear the entry blocks (z-10)
    // and the current-time line (z-20) — but the dashboard's own header is ALSO z-30, and with
    // equal z-indices the later element in the document wins. The calendar is later, so its
    // headings painted straight over the page chrome as soon as the page scrolled.
    //
    // Isolating scopes those three z-values to the inside of this card, where they were only ever
    // meant to apply. The card then takes its natural place in the page, beneath the header,
    // whatever numbers get used in here later.
    <div className={cn('isolate overflow-hidden rounded-2xl border bg-card shadow-soft', className)}>
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

        {/* The margin is what lets each hour label straddle its own line without the first one
            being clipped by the top of the scroller. It sits on the whole grid — gutter, columns,
            entries and the current-time line together — so the minute-to-pixel mapping is
            untouched and nothing drifts out of alignment. */}
        <div className="mt-3 flex" style={{ height: gridHeight }}>
          {/* Hour gutter. Each label is centred ON the line that opens its hour, which is where the
              eye looks for it: "9:00 AM" reads as a label for that line, not for the band under it.
              Anchored at the line and pulled up half its own height, so it stays centred whatever
              the font size becomes. The last hour's label sits at the TOP of the last band, so the
              bottom edge of the grid never cuts one in half. */}
          <div className="w-14 shrink-0 sm:w-16">
            {hours.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_PX }}>
                <span className="absolute right-2 top-0 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground">
                  {formatTime(`${String(h).padStart(2, '0')}:00`)}
                </span>
              </div>
            ))}
          </div>

          {/* The day columns share one relative parent so the rest-hours bands can span all of
              them with a single element. Rendered per column instead, the illustration would
              repeat seven times across a week. */}
          <div className="relative flex flex-1">
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

                {day.today && (
                  <NowLine nowMinutes={nowMinutes} gridStart={gridStart} gridEnd={endHour * 60} />
                )}
              </div>
            ))}

            {/* Closed hours, drawn over every column. Two bands, because the grid can extend past
                the teaching day at either end — before 06:00 when someone is looking at the
                calendar overnight, and after 23:30 whenever the grid reaches midnight. */}
            <RestHoursBand
              top={0}
              height={(Math.min(TEACHING_START, endHour * 60) - gridStart) / 60 * HOUR_PX}
              label="Sessions run from 6:00 AM. Get some sleep — you have earned it."
            />
            <RestHoursBand
              top={(Math.max(TEACHING_END, gridStart) - gridStart) / 60 * HOUR_PX}
              height={(endHour * 60 - Math.max(TEACHING_END, gridStart)) / 60 * HOUR_PX}
              // No label: this band is only the 23:30–24:00 half hour, far too short to read.
              // The message lives in the panel below, which has room for it.
              label=""
            />
          </div>
        </div>

        {/* Reached by scrolling past the last hour. Rendered only when the grid actually runs to
            the end of the day — paging to a week whose grid stops earlier should not claim the
            evening is closed. */}
        {endHour * 60 >= TEACHING_END && (
          <RestHoursPanel label="Sessions run from 6:00 AM to 11:30 PM. The rest of the night is yours — get some sleep." />
        )}
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

/**
 * The red line marking the present moment — only ever drawn on today's column.
 *
 * <p>Guarded at BOTH ends. `useGridBounds` now stretches the grid to include "now", so neither
 * branch should fire; they stay as a backstop, because a line drawn outside the grid does not
 * simply vanish — it lands on top of whatever is rendered above or below the calendar.
 */
function NowLine({
  nowMinutes,
  gridStart,
  gridEnd,
}: {
  nowMinutes: number;
  gridStart: number;
  gridEnd: number;
}) {
  if (nowMinutes < gridStart || nowMinutes > gridEnd) return null;
  const top = ((nowMinutes - gridStart) / 60) * HOUR_PX;
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
function useServerClock(serverNow: string, onDayRollover?: () => void): number {
  const [anchor, setAnchor] = useState(() => ({
    serverMinutes: minutesOfDay(serverNow),
    mountedAt: Date.now(),
  }));
  const [minutes, setMinutes] = useState(anchor.serverMinutes);
  const previous = useRef(anchor.serverMinutes);
  const rollover = useRef(onDayRollover);
  rollover.current = onDayRollover;

  // Re-anchor whenever the server states the time again. The anchor used to be captured once on
  // mount, so a tab left open for hours drifted with the device's own clock and had no way to be
  // corrected; every refetch now resets it to the truth.
  useEffect(() => {
    setAnchor({ serverMinutes: minutesOfDay(serverNow), mountedAt: Date.now() });
  }, [serverNow]);

  useEffect(() => {
    const tick = () => {
      // Wrapped at midnight. Without the modulo, a page open from 23:50 reads 24:10 twenty minutes
      // later — a time that does not exist, and one that sits below every hour the grid draws.
      const next = (anchor.serverMinutes + Math.floor((Date.now() - anchor.mountedAt) / 60000)) % 1440;

      // Crossing midnight also makes the DATA wrong: `day.today` was decided by the server when the
      // week was fetched, so the red line would keep drawing on what is now yesterday's column.
      // Telling the page lets it refetch. Guarded on a genuine wrap — late evening to early morning
      // — rather than any decrease, so a re-anchor that nudges the clock back a minute cannot
      // trigger a refetch loop.
      if (previous.current > 1380 && next < 60) {
        rollover.current?.();
      }
      previous.current = next;
      setMinutes(next);
    };
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
function useGridBounds(days: CalendarDay[], nowMinutes: number) {
  return useMemo(() => {
    let earliest = DEFAULT_START_HOUR * 60;
    let latest = DEFAULT_END_HOUR * 60;
    for (const day of days) {
      for (const entry of day.entries) {
        earliest = Math.min(earliest, toMinutes(entry.start));
        latest = Math.max(latest, toMinutes(entry.end));
      }
    }

    // The current-time line is part of today, so the grid has to reach far enough to draw it.
    // Without this, a tutor opening the page at 06:00 or 23:00 sees no red line at all: it would
    // be positioned above or below every hour row that exists. Only when one of the visible days
    // IS today — paging forward a week should not stretch the grid towards a "now" that is not on
    // screen.
    //
    // The +1 makes the hour CONTAINING now the last one drawn rather than the one before it, so
    // 23:59 still yields an hour row up to 24:00 for the line to sit in.
    if (days.some((day) => day.today)) {
      earliest = Math.min(earliest, nowMinutes);
      latest = Math.max(latest, nowMinutes + 1);
    }

    return {
      startHour: Math.max(0, Math.floor(earliest / 60)),
      endHour: Math.min(24, Math.ceil(latest / 60)),
    };
  }, [days, nowMinutes]);
}
