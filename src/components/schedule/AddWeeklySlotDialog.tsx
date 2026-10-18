import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTime, type AddWeeklySlot, type SlotType, type WeekdayName } from '@/services/availabilityService';

/**
 * Half-hour steps across TopTutor's teaching hours, 06:00 to 23:30.
 *
 * <p>Mirrors `toptutor.booking.day-start` / `day-end`, which the server enforces on every path that
 * creates a time range. These dropdowns are the only place a tutor meets the hours, and offering a
 * time the server would then refuse is worse than not offering it at all.
 *
 * <p>23:30 is the last END on the grid, so the latest full hour is 22:30–23:30. Nothing runs into
 * the small hours — that is the point of the rule, for the tutor as much as the student.
 */
const TIMES: string[] = [];
for (let h = 6; h <= 23; h++) {
  for (const m of ['00', '30']) TIMES.push(`${String(h).padStart(2, '0')}:${m}`);
}

const DAYS: { value: WeekdayName; label: string }[] = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];

interface Props {
  onAdd: (slot: AddWeeklySlot) => Promise<unknown>;
  pending: boolean;
  /** Preselected when opened from a specific day column. */
  defaultDay?: WeekdayName;
}

/**
 * Adds a recurring window to one or more weekdays.
 *
 * <p>Deliberately weekly, not dated: the tutor is describing a repeating pattern, and every future
 * week is generated from it. The server rejects overlaps, so validation here stays to what it can
 * settle on its own — the rest surfaces as the server's own message.
 */
export function AddWeeklySlotDialog({ onAdd, pending, defaultDay }: Props) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<WeekdayName[]>(defaultDay ? [defaultDay] : []);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('11:00');
  const [type, setType] = useState<SlotType>('AVAILABLE');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: WeekdayName) =>
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    );

  const submit = async () => {
    setError(null);
    if (days.length === 0) {
      setError('Pick at least one day.');
      return;
    }
    if (start >= end) {
      setError('The end time must be after the start time.');
      return;
    }
    try {
      await onAdd({
        days,
        start,
        end,
        type,
        endDate: null,
        note: note.trim() || null,
      });
      setOpen(false);
      setDays(defaultDay ? [defaultDay] : []);
      setNote('');
    } catch (e) {
      // Overlaps and minimum-length rules are the server's call; show exactly what it said.
      setError(e instanceof Error ? e.message : 'Could not add that slot.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="h-4 w-4" /> Add slot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a weekly slot</DialogTitle>
          <DialogDescription>
            This repeats every week. Students book it on a specific date, and it reopens the following
            week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Repeats on</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    'h-9 w-11 rounded-lg border text-sm font-medium transition-colors',
                    days.includes(day.value)
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'bg-card hover:bg-secondary',
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <TimeField label="From" value={start} onChange={setStart} />
            <TimeField label="To" value={end} onChange={setEnd} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as SlotType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available for booking</SelectItem>
                <SelectItem value="UNAVAILABLE">Blocked (not bookable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'UNAVAILABLE' ? 'e.g. Family time' : 'e.g. O-Levels only'}
              maxLength={255}
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="gradient" disabled={pending} onClick={submit}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
        <SelectContent>
          {TIMES.map((t) => (
            <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
