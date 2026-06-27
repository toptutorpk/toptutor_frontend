import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];

type Cell = 'free' | 'booked' | 'off';

function seed(): Record<string, Cell> {
  const map: Record<string, Cell> = {};
  DAYS.forEach((d, di) =>
    HOURS.forEach((h, hi) => {
      const v: Cell = (di + hi) % 5 === 0 ? 'booked' : (di + hi) % 3 === 0 ? 'off' : 'free';
      map[`${d}-${h}`] = v;
    }),
  );
  return map;
}

export default function TutorSchedule() {
  const [grid, setGrid] = useState<Record<string, Cell>>(seed);

  const toggle = (key: string) => {
    setGrid((g) => {
      if (g[key] === 'booked') return g;
      return { ...g, [key]: g[key] === 'free' ? 'off' : 'free' };
    });
  };

  return (
    <div>
      <PageHeader
        title="Schedule & Availability"
        description="Tap a slot to toggle availability. Booked sessions are locked."
        action={
          <Button variant="gradient" onClick={() => toast.success('Availability saved')}>
            Save availability
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <Legend color="bg-emerald-500" label="Available" />
        <Legend color="bg-brand-600" label="Booked" />
        <Legend color="bg-secondary border" label="Unavailable" />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card p-4 shadow-soft">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-sm font-semibold">
                {d}
              </div>
            ))}
            {HOURS.map((h) => (
              <Row key={h} hour={h} grid={grid} onToggle={toggle} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        <h3 className="font-display font-bold">Today’s sessions</h3>
        <ul className="mt-3 space-y-2">
          {[
            { time: '15:00', student: 'Hassan A.', subject: 'Mathematics' },
            { time: '19:00', student: 'Maryam K.', subject: 'Physics' },
          ].map((s) => (
            <li key={s.time} className="flex items-center gap-3 rounded-xl border bg-secondary/30 p-3">
              <Badge variant="info">{s.time}</Badge>
              <span className="font-medium">{s.student}</span>
              <span className="text-sm text-muted-foreground">{s.subject}</span>
              <Button size="sm" variant="gradient" className="ml-auto">
                Join
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({
  hour,
  grid,
  onToggle,
}: {
  hour: string;
  grid: Record<string, Cell>;
  onToggle: (key: string) => void;
}) {
  return (
    <>
      <div className="flex items-center text-xs text-muted-foreground">{hour}</div>
      {DAYS.map((d) => {
        const key = `${d}-${hour}`;
        const v = grid[key];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            disabled={v === 'booked'}
            className={cn(
              'h-12 rounded-lg border text-xs font-medium transition-all',
              v === 'free' && 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
              v === 'booked' && 'cursor-not-allowed border-transparent bg-brand-600 text-white',
              v === 'off' && 'bg-secondary text-muted-foreground hover:bg-secondary/70',
            )}
          >
            {v === 'booked' ? 'Booked' : ''}
          </button>
        );
      })}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-3.5 w-3.5 rounded', color)} />
      {label}
    </div>
  );
}
