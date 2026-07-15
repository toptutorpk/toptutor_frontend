import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Video, Home, Sparkles, Info, Plus, X, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/DashboardKit';
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
import { ApiError } from '@/api/client';
import {
  availabilityService,
  formatRange,
  formatTime,
  type AvailabilityRange,
} from '@/services/availabilityService';

// Time options every 30 minutes from 07:00 to 22:00.
const TIMES: string[] = [];
for (let h = 7; h <= 22; h++) {
  for (const m of ['00', '30']) TIMES.push(`${String(h).padStart(2, '0')}:${m}`);
}

export default function TutorSchedule() {
  const { data, isLoading } = useQuery({
    queryKey: ['tutor', 'availability'],
    queryFn: () => availabilityService.getMine(),
  });

  const [online, setOnline] = useState<AvailabilityRange[]>([]);
  const [home, setHome] = useState<AvailabilityRange[]>([]);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoStart, setDemoStart] = useState('16:00');
  const [demoEnd, setDemoEnd] = useState('16:30');

  useEffect(() => {
    if (!data) return;
    setOnline(data.online);
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
        online: online.filter((r) => !r.booked).map((r) => ({ start: r.start, end: r.end })),
        home: home.filter((r) => !r.booked).map((r) => ({ start: r.start, end: r.end })),
        demoEnabled,
        demoSlot: demoEnabled ? { start: demoStart, end: demoEnd } : null,
      }),
    onSuccess: (res) => {
      setOnline(res.online);
      setHome(res.home);
      toast.success('Availability saved');
    },
    onError: (e) =>
      toast.error('Could not save', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Schedule & Availability" description="Set the time slots you’re available." />
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const offersOnline = data.modes.includes('online');
  const offersHome = data.modes.includes('home_visit');
  const nothingToSet = !offersOnline && !offersHome;

  const addRange = (
    list: AvailabilityRange[],
    setter: (v: AvailabilityRange[]) => void,
    start: string,
    end: string,
  ) => {
    if (start >= end) {
      toast.error('The end time must be after the start time');
      return;
    }
    if (list.some((r) => r.start === start && r.end === end)) {
      toast.info('That slot is already added');
      return;
    }
    setter([...list, { id: 0, start, end, booked: false }].sort((a, b) => a.start.localeCompare(b.start)));
  };

  const removeRange = (list: AvailabilityRange[], setter: (v: AvailabilityRange[]) => void, idx: number) => {
    if (list[idx].booked) return;
    setter(list.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <PageHeader
        title="Schedule & Availability"
        description="List the time ranges you’re available. Students can reserve any open slot for the month."
        action={
          <Button variant="gradient" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save availability
          </Button>
        }
      />

      {nothingToSet && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border bg-card p-4 text-sm text-muted-foreground shadow-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <span>
            Add <span className="font-medium text-foreground">Online</span> or{' '}
            <span className="font-medium text-foreground">Home visit</span> to your teaching modes in
            your profile to set availability.
          </span>
        </div>
      )}

      {offersOnline && (
        <RangeEditor
          title="Online session slots"
          subtitle="Time ranges students can book a live online session."
          icon={Video}
          ranges={online}
          onAdd={(s, e) => addRange(online, setOnline, s, e)}
          onRemove={(i) => removeRange(online, setOnline, i)}
        />
      )}

      {offersHome && (
        <RangeEditor
          title="Home tuition slots"
          subtitle="Time ranges you can give home tuition (monthly). Booked slots are locked."
          icon={Home}
          ranges={home}
          onAdd={(s, e) => addRange(home, setHome, s, e)}
          onRemove={(i) => removeRange(home, setHome, i)}
          className="mt-6"
        />
      )}

      {/* Free demo opt-in */}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="border-b bg-gradient-to-r from-brand-50 to-transparent p-5 dark:from-brand-500/10">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="font-display font-bold">Offer a free demo session</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Tutors who offer a free demo get a{' '}
                <span className="font-medium text-emerald-600">“Free Demo” badge</span> and rank{' '}
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
    </div>
  );
}

function RangeEditor({
  title,
  subtitle,
  icon: Icon,
  ranges,
  onAdd,
  onRemove,
  className,
}: {
  title: string;
  subtitle: string;
  icon: typeof Video;
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
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="font-display font-bold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Existing slots */}
      {ranges.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {ranges.map((r, i) => (
            <span
              key={r.id || `${r.start}-${r.end}`}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium',
                r.booked
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                  : 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400',
              )}
            >
              {formatRange(r.start, r.end)}
              {r.booked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <button onClick={() => onRemove(i)} aria-label="Remove slot" className="hover:text-red-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">No slots yet — add the times you’re available.</p>
      )}

      {/* Add a slot */}
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
