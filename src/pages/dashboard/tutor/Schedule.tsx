import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Info,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { AddWeeklySlotDialog } from '@/components/schedule/AddWeeklySlotDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useJoinSession } from '@/hooks/useJoinSession';
import { ApiError } from '@/api/client';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  availabilityService,
  formatRange,
  formatTime,
  type AddWeeklySlot,
  type AvailabilityRange,
  type WeeklySlot,
} from '@/services/availabilityService';

// Time options every 30 minutes from 07:00 to 22:00.
const TIMES: string[] = [];
for (let h = 7; h <= 22; h++) {
  for (const m of ['00', '30']) TIMES.push(`${String(h).padStart(2, '0')}:${m}`);
}

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export default function TutorSchedule() {
  const { join: joinSession, rulesDialog } = useJoinSession();
  const isMobile = useIsMobile();
  // A phone cannot show seven time columns legibly, so it always shows a single day. The toggle is
  // hidden rather than disabled — offering a view that doesn't fit helps nobody.
  const [view, setView] = useState<'week' | 'day'>('week');
  const effectiveView = isMobile ? 'day' : view;
  const [anchor, setAnchor] = useState(() => startOfToday());

  const { from, to } = useMemo(
    () =>
      effectiveView === 'week'
        ? { from: toISO(startOfWeek(anchor)), to: toISO(addDays(startOfWeek(anchor), 6)) }
        : { from: toISO(anchor), to: toISO(anchor) },
    [anchor, effectiveView],
  );

  const queryClient = useQueryClient();
  // Same key HomeAndDemoSection uses, so react-query serves both from one request rather than
  // fetching the profile modes twice on every visit.
  const availability = useQuery({
    queryKey: ['tutor', 'availability'],
    queryFn: () => availabilityService.getMine(),
  });
  const calendar = useQuery({
    queryKey: ['tutor', 'calendar', from, to],
    queryFn: () => availabilityService.weekly.calendar(from, to),
  });
  const weeklySlots = useQuery({
    queryKey: ['tutor', 'weekly-slots'],
    queryFn: () => availabilityService.weekly.list(),
  });

  const invalidateSchedule = () => {
    queryClient.invalidateQueries({ queryKey: ['tutor', 'calendar'] });
    queryClient.invalidateQueries({ queryKey: ['tutor', 'weekly-slots'] });
  };

  const addSlot = useMutation({
    mutationFn: (slot: AddWeeklySlot) => availabilityService.weekly.add(slot),
    onSuccess: () => {
      invalidateSchedule();
      toast.success('Slot added to your weekly schedule');
    },
  });

  const removeSlot = useMutation({
    mutationFn: (id: number) => availabilityService.weekly.remove(id),
    onSuccess: () => {
      invalidateSchedule();
      toast.success('Slot removed');
    },
    onError: (e) => toast.error('Could not remove that slot', { description: errorText(e) }),
  });

  const step = effectiveView === 'week' ? 7 : 1;

  // Undefined while the profile is still loading — treated as "offers online" so the Add control
  // does not flash out and back in on every visit. The server is the actual gate either way.
  const offersOnline = availability.data ? availability.data.modes.includes('online') : true;

  return (
    <div>
      <PageHeader
        title="Schedule & Availability"
        description="Your weekly schedule repeats automatically. Booked sessions appear on the day they happen."
      />

      {/* ---- Online calendar ------------------------------------------------ */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous"
            onClick={() => setAnchor((d) => addDays(d, -step))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setAnchor(startOfToday())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next"
            onClick={() => setAnchor((d) => addDays(d, step))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="ml-2 font-display text-sm font-bold sm:text-base">
            {rangeLabel(from, to, effectiveView)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex rounded-lg border p-0.5">
              {(['day', 'week'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors',
                    view === v
                      ? 'bg-brand-600 text-white'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          {offersOnline && (
            <AddWeeklySlotDialog
              onAdd={(slot) => addSlot.mutateAsync(slot)}
              pending={addSlot.isPending}
            />
          )}
        </div>
      </div>

      {/* The calendar itself stays visible either way: a tutor who has switched Online off may still
          have booked sessions and published slots, and hiding the page would hide those rather than
          help. Only the ability to publish MORE online time is withdrawn. */}
      {!offersOnline && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border bg-card p-4 text-sm text-muted-foreground shadow-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <span>
            Add <span className="font-medium text-foreground">Online</span> to your teaching modes
            in your profile to offer online sessions and publish weekly slots.
          </span>
        </div>
      )}

      {/* On a phone the day view needs a way to move between days without paging one at a time. */}
      {isMobile && <DateStrip anchor={anchor} onPick={setAnchor} />}

      {calendar.isLoading || !calendar.data ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScheduleCalendar
          days={calendar.data.days}
          serverNow={calendar.data.serverNow}
          // Midnight passed with the page open. The fetched week still marks yesterday as "today",
          // so the red line would sit on the wrong column until someone reloaded. Move the view to
          // the real today and refetch.
          onDayRollover={() => {
            setAnchor(startOfToday());
            invalidateSchedule();
          }}
          onJoin={(entry) => {
            if (entry.bookingId) void joinSession(entry.bookingId);
          }}
        />
      )}

      {rulesDialog}
      <Legend />

      {/* ---- The recurring pattern behind the calendar ----------------------- */}
      <WeeklySlotManager
        slots={weeklySlots.data ?? []}
        loading={weeklySlots.isLoading}
        onRemove={(id) => removeSlot.mutate(id)}
        removingId={removeSlot.isPending ? removeSlot.variables : undefined}
      />

      {/* ---- Home tuition + free demo (unchanged, undated) ------------------- */}
      <HomeAndDemoSection />
    </div>
  );
}

function Legend() {
  const items = [
    {
      label: 'Open',
      className: 'border-dashed border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    },
    { label: 'Booked', className: 'border-brand-300 bg-brand-100 dark:bg-brand-500/20' },
    { label: 'Too short to book', className: 'border-border bg-muted' },
    { label: 'Unavailable', className: 'border-slate-300 bg-slate-100 dark:bg-slate-500/15' },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className={cn('h-3 w-3 rounded border', item.className)} />
          {item.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-px w-4 bg-red-500" /> Current time
      </span>
    </div>
  );
}

/** A swipeable week of dates — the phone's substitute for the week grid. */
function DateStrip({ anchor, onPick }: { anchor: Date; onPick: (d: Date) => void }) {
  const week = useMemo(() => {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchor]);
  const todayISO = toISO(startOfToday());

  return (
    <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
      {week.map((date) => {
        const iso = toISO(date);
        const selected = iso === toISO(anchor);
        return (
          <button
            key={iso}
            onClick={() => onPick(date)}
            className={cn(
              'flex min-w-[3rem] shrink-0 flex-col items-center rounded-xl border px-2 py-1.5 transition-colors',
              selected ? 'border-brand-600 bg-brand-600 text-white' : 'bg-card hover:bg-secondary',
            )}
          >
            <span className="text-[10px] uppercase opacity-80">
              {date.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <span className="text-sm font-semibold tabular-nums">{date.getDate()}</span>
            {iso === todayISO && (
              <span
                className={cn(
                  'mt-0.5 h-1 w-1 rounded-full',
                  selected ? 'bg-white' : 'bg-brand-600',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The recurring rows themselves.
 *
 * <p>Removal lives here rather than on a calendar block on purpose: deleting from a dated cell is
 * ambiguous — just that Monday, or every Monday? Here it plainly means the whole recurrence, and the
 * server refuses if paid sessions are already booked against it.
 */
function WeeklySlotManager({
  slots,
  loading,
  onRemove,
  removingId,
}: {
  slots: WeeklySlot[];
  loading: boolean;
  onRemove: (id: number) => void;
  removingId?: number;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, WeeklySlot[]>();
    for (const slot of slots) {
      map.set(slot.dayOfWeek, [...(map.get(slot.dayOfWeek) ?? []), slot]);
    }
    return map;
  }, [slots]);

  return (
    <div className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Video className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="font-display font-bold leading-tight">Weekly online schedule</h3>
          <p className="text-xs text-muted-foreground">
            The pattern behind your calendar. Slots can’t overlap, and a slot must be at least an
            hour long to be bookable.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No weekly slots yet — add one to start taking online bookings.
        </p>
      ) : (
        <div className="space-y-2.5">
          {DAY_ORDER.filter((day) => byDay.has(day)).map((day) => (
            <div key={day} className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-sm font-medium capitalize">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </span>
              {byDay.get(day)!.map((slot) => (
                <span
                  key={slot.id}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-medium',
                    slot.type === 'AVAILABLE'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300',
                  )}
                >
                  {formatRange(slot.start, slot.end)}
                  {slot.note && <span className="text-xs opacity-70">· {slot.note}</span>}
                  <button
                    onClick={() => onRemove(slot.id)}
                    disabled={removingId === slot.id}
                    aria-label="Remove slot"
                    className="hover:text-red-600 disabled:opacity-50"
                  >
                    {removingId === slot.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Home-visit ranges and the free-demo opt-in — undated, and unaffected by the online calendar. */
function HomeAndDemoSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['tutor', 'availability'],
    queryFn: () => availabilityService.getMine(),
  });

  const [home, setHome] = useState<AvailabilityRange[]>([]);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoStart, setDemoStart] = useState('16:00');
  const [demoEnd, setDemoEnd] = useState('16:30');

  useEffect(() => {
    if (!data) return;
    setHome(data.home);
    setDemoEnabled(data.demoEnabled);
    if (data.demoSlot) {
      setDemoStart(data.demoSlot.start);
      setDemoEnd(data.demoSlot.end);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      availabilityService.updateMine({
        home: home.filter((r) => !r.booked).map((r) => ({ start: r.start, end: r.end })),
        demoEnabled,
        demoSlot: demoEnabled ? { start: demoStart, end: demoEnd } : null,
      }),
    onSuccess: (res) => {
      setHome(res.home);
      toast.success('Availability saved');
    },
    onError: (e) => toast.error('Could not save', { description: errorText(e) }),
  });

  if (isLoading || !data) return null;

  const offersHome = data.modes.includes('home_visit');

  const addRange = (start: string, end: string) => {
    if (start >= end) {
      toast.error('The end time must be after the start time');
      return;
    }
    if (home.some((r) => r.start === start && r.end === end)) {
      toast.info('That slot is already added');
      return;
    }
    setHome(
      [...home, { id: 0, start, end, booked: false }].sort((a, b) =>
        a.start.localeCompare(b.start),
      ),
    );
  };

  return (
    <>
      {!offersHome && (
        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border bg-card p-4 text-sm text-muted-foreground shadow-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <span>
            Add <span className="font-medium text-foreground">Home visit</span> to your teaching
            modes in your profile to offer home tuition as well.
          </span>
        </div>
      )}

      {offersHome && (
        <RangeEditor
          title="Home tuition slots"
          subtitle="Time ranges you can give home tuition (monthly). Booked slots are locked."
          ranges={home}
          onAdd={addRange}
          onRemove={(i) => {
            if (home[i].booked) return;
            setHome(home.filter((_, idx) => idx !== i));
          }}
          className="mt-6"
        />
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="border-b bg-gradient-to-r from-brand-50 to-transparent p-5 dark:from-brand-500/10">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="font-display font-bold">Offer a free demo session</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your listing shows{' '}
                <span className="font-medium text-emerald-600">“Free 15-min intro call”</span>,
                learners get a button to request one on your profile, and you rank{' '}
                <span className="font-medium text-foreground">higher in search</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox checked={demoEnabled} onCheckedChange={(v) => setDemoEnabled(Boolean(v))} />
            <span className="text-sm font-medium">I’m available for a free demo session</span>
          </label>
          {demoEnabled && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-secondary/30 p-4">
              <Clock className="mb-2 h-4 w-4 text-brand-500" />
              <TimeField label="From" value={demoStart} onChange={setDemoStart} />
              <TimeField label="To" value={demoEnd} onChange={setDemoEnd} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="gradient" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save home &amp; demo availability
        </Button>
      </div>
    </>
  );
}

function RangeEditor({
  title,
  subtitle,
  ranges,
  onAdd,
  onRemove,
  className,
}: {
  title: string;
  subtitle: string;
  ranges: AvailabilityRange[];
  onAdd: (start: string, end: string) => void;
  onRemove: (index: number) => void;
  className?: string;
}) {
  const [from, setFrom] = useState('09:00');
  const [to, setTo] = useState('11:00');

  return (
    <div className={cn('rounded-2xl border bg-card p-5 shadow-soft', className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Home className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="font-display font-bold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {ranges.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {ranges.map((r, i) => (
            <span
              key={r.id || `${r.start}-${r.end}`}
              className={cn(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-medium',
                r.booked
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                  : 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400',
              )}
            >
              {formatRange(r.start, r.end)}
              {r.booked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <button
                  onClick={() => onRemove(i)}
                  aria-label="Remove slot"
                  className="hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          No slots yet — add the times you’re available.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-secondary/30 p-4">
        <TimeField label="From" value={from} onChange={setFrom} />
        <TimeField label="To" value={to} onChange={setTo} />
        <Button variant="outline" onClick={() => onAdd(from, to)}>
          <Plus className="h-4 w-4" /> Add slot
        </Button>
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIMES.map((t) => (
            <SelectItem key={t} value={t}>
              {formatTime(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---- date helpers (local dates only — the server sends and expects YYYY-MM-DD) ----

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday-first, matching how the weekly schedule itself is ordered. */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function rangeLabel(from: string, to: string, view: 'week' | 'day'): string {
  const start = new Date(`${from}T00:00:00`);
  if (view === 'day') {
    return start.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  const end = new Date(`${to}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' },
  );
  const endLabel = end.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

function errorText(e: unknown): string {
  return e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.';
}
