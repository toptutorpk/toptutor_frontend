import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Video, Home, Sparkles, Info, Clock } from 'lucide-react';
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
import { availabilityService, type AvailSlot } from '@/services/availabilityService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];

const key = (day: number, time: string) => `${day}-${time}`;
const toSet = (slots: AvailSlot[]) => new Set(slots.map((s) => key(s.day, s.time)));
const toSlots = (set: Set<string>): AvailSlot[] =>
  [...set].map((k) => {
    const [d, t] = k.split('-');
    return { day: Number(d), time: t };
  });

export default function TutorSchedule() {
  const { data, isLoading } = useQuery({
    queryKey: ['tutor', 'availability'],
    queryFn: () => availabilityService.getMine(),
  });

  const [online, setOnline] = useState<Set<string>>(new Set());
  const [home, setHome] = useState<Set<string>>(new Set());
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoDay, setDemoDay] = useState('1');
  const [demoTime, setDemoTime] = useState('16:00');

  useEffect(() => {
    if (!data) return;
    setOnline(toSet(data.online));
    setHome(toSet(data.home));
    setDemoEnabled(data.demoEnabled);
    if (data.demoSlot) {
      setDemoDay(String(data.demoSlot.day));
      setDemoTime(data.demoSlot.time);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      availabilityService.updateMine({
        online: toSlots(online),
        home: toSlots(home),
        demoEnabled,
        demoSlot: demoEnabled ? { day: Number(demoDay), time: demoTime } : null,
      }),
    onSuccess: () => toast.success('Availability saved'),
    onError: (e) =>
      toast.error('Could not save', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Schedule & Availability" description="Set when students can book you." />
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const offersOnline = data.modes.includes('online');
  const offersHome = data.modes.includes('home_visit');
  const nothingToSet = !offersOnline && !offersHome;

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, k: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Schedule & Availability"
        description="Tap the slots when you’re free. Students can only book times you mark available."
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
        <WeekGrid
          title="Online session availability"
          subtitle="Times students can book a live online session."
          icon={Video}
          selected={online}
          onToggle={(k) => toggle(setOnline, k)}
        />
      )}

      {offersHome && (
        <WeekGrid
          title="Home tuition hours"
          subtitle="Times you can travel to a student’s home."
          icon={Home}
          selected={home}
          onToggle={(k) => toggle(setHome, k)}
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
                <span className="font-medium text-foreground">higher in search</span> — students book
                demo-friendly tutors far more often.
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Day</label>
                <Select value={demoDay} onValueChange={setDemoDay}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Time</label>
                <Select value={demoTime} onValueChange={setDemoTime}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                Students can request a demo at this time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeekGrid({
  title,
  subtitle,
  icon: Icon,
  selected,
  onToggle,
  className,
}: {
  title: string;
  subtitle: string;
  icon: typeof Video;
  selected: Set<string>;
  onToggle: (key: string) => void;
  className?: string;
}) {
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

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-2">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-sm font-semibold">{d}</div>
            ))}
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="flex items-center text-xs text-muted-foreground">{h}</div>
                {DAYS.map((_, dayIdx) => {
                  const k = `${dayIdx}-${h}`;
                  const on = selected.has(k);
                  return (
                    <button
                      key={k}
                      onClick={() => onToggle(k)}
                      className={cn(
                        'h-11 rounded-lg border text-xs font-medium transition-all',
                        on
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/70',
                      )}
                      aria-pressed={on}
                    >
                      {on ? 'Free' : ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
