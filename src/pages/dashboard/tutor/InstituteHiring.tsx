import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Save, Building2, EyeOff, ShieldCheck } from 'lucide-react';
import {
  hiringPreferenceService,
  type EmploymentType,
  type HiringPreference,
} from '@/services/instituteService';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { toast } from '@/components/ui/sonner';
import { cn, noNegative } from '@/lib/utils';

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string; hint: string }[] = [
  { value: 'FULL_TIME', label: 'Full time', hint: 'A full teaching load at one institute' },
  { value: 'PART_TIME', label: 'Part time', hint: 'A regular but partial load' },
  { value: 'VISITING', label: 'Visiting', hint: 'Paid per class or subject, often at several' },
];

/**
 * Floor for the earliest start date. "Earliest" is a promise about the future, so a past date
 * says nothing an institute can act on.
 *
 * <p>date-fns rather than `toISOString().slice(0, 10)`: that is UTC, and at UTC+5 any evening
 * after 7pm it returns yesterday.
 */
const today = () => format(new Date(), 'yyyy-MM-dd');

interface FormState {
  openToInstituteRoles: boolean;
  employmentType: string;
  expectedSalaryMin: string;
  expectedSalaryMax: string;
  earliestStart: string;
  noticePeriodDays: string;
  note: string;
}

const EMPTY: FormState = {
  openToInstituteRoles: false,
  employmentType: '',
  expectedSalaryMin: '',
  expectedSalaryMax: '',
  earliestStart: '',
  noticePeriodDays: '',
  note: '',
};

/**
 * Where a tutor decides whether schools and academies may approach them about jobs.
 *
 * <p>Its own page rather than a row in profile settings: this is a different relationship from
 * being booked by a parent, and it deserves to be found, read and answered deliberately rather
 * than toggled past on the way to something else.
 */
export default function InstituteHiring() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tutor', 'hiring-preference'],
    queryFn: () => hiringPreferenceService.get(),
  });
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!data) return;
    setForm({
      openToInstituteRoles: data.openToInstituteRoles,
      employmentType: data.employmentType ?? '',
      expectedSalaryMin: data.expectedSalaryMin != null ? String(data.expectedSalaryMin) : '',
      expectedSalaryMax: data.expectedSalaryMax != null ? String(data.expectedSalaryMax) : '',
      earliestStart: data.earliestStart ?? '',
      noticePeriodDays: data.noticePeriodDays != null ? String(data.noticePeriodDays) : '',
      note: data.note ?? '',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: HiringPreference) => hiringPreferenceService.save(payload),
    onSuccess: (saved) => {
      toast.success(
        saved.openToInstituteRoles
          ? "You're now visible to verified institutes"
          : "You're hidden from institute searches",
      );
      qc.invalidateQueries({ queryKey: ['tutor', 'hiring-preference'] });
    },
    onError: (e) =>
      toast.error('Could not save', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  if (isLoading) return <LoadingState label="Loading your preferences…" />;
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} message="Could not load your preferences." />;
  }

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const text = (v: string) => (v.trim() === '' ? undefined : v.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({
      openToInstituteRoles: form.openToInstituteRoles,
      employmentType: (text(form.employmentType) as EmploymentType | undefined) ?? undefined,
      expectedSalaryMin: num(form.expectedSalaryMin),
      expectedSalaryMax: num(form.expectedSalaryMax),
      earliestStart: text(form.earliestStart),
      noticePeriodDays: num(form.noticePeriodDays),
      note: text(form.note),
    });
  };

  const open = form.openToInstituteRoles;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Institute hiring</h1>
        <p className="mt-1 text-muted-foreground">
          Schools and academies hire teachers through TopTutor. You decide whether they can find you.
        </p>
      </div>

      {/* The consent switch is the whole page in one control; everything below only matters once
          it is on, so the rest is disabled rather than hidden — you can read the terms you would
          be agreeing to before you agree to them. */}
      <section
        className={cn(
          'rounded-2xl border p-5 shadow-soft transition-colors',
          open
            ? 'border-emerald-300/70 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10'
            : 'bg-card',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                open
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-secondary text-muted-foreground',
              )}
            >
              {open ? <Building2 className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <h2 className="font-display font-bold">
                {open ? 'Open to institute roles' : 'Not looking for institute roles'}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {open
                  ? 'Verified institutes can find you in their teacher search and send you offers. Your contact details stay private until you accept one.'
                  : 'You will not appear in any institute search. Parents and students can still find and book you as normal.'}
              </p>
            </div>
          </div>
          <Switch
            checked={open}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, openToInstituteRoles: Boolean(v) }))
            }
            aria-label="Open to institute roles"
          />
        </div>
      </section>

      <section className={cn('rounded-2xl border bg-card p-5 shadow-soft', !open && 'opacity-60')}>
        <h2 className="font-display font-bold">Your terms</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Institutes filter on these, so the closer they are to what you would accept, the fewer
          irrelevant offers you get.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="employmentType">Type of role</Label>
            <Select
              value={form.employmentType}
              onValueChange={set('employmentType')}
              disabled={!open}
            >
              <SelectTrigger id="employmentType" className="mt-1.5">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} — <span className="text-muted-foreground">{t.hint}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Num
            id="expectedSalaryMin"
            label="Expected salary from (PKR/month)"
            value={form.expectedSalaryMin}
            onChange={set('expectedSalaryMin')}
            disabled={!open}
            placeholder="40000"
          />
          <Num
            id="expectedSalaryMax"
            label="…up to (PKR/month)"
            value={form.expectedSalaryMax}
            onChange={set('expectedSalaryMax')}
            disabled={!open}
            placeholder="70000"
          />

          <div>
            <Label htmlFor="earliestStart">Earliest start date</Label>
            <DatePicker
              id="earliestStart"
              value={form.earliestStart}
              min={today()}
              onChange={set('earliestStart')}
              disabled={!open}
              className="mt-1.5"
            />
          </div>
          <Num
            id="noticePeriodDays"
            label="Notice period (days)"
            value={form.noticePeriodDays}
            onChange={set('noticePeriodDays')}
            disabled={!open}
            placeholder="30"
          />

          <div className="sm:col-span-2">
            <Label htmlFor="note">Anything else</Label>
            <textarea
              id="note"
              rows={3}
              value={form.note}
              onChange={(e) => set('note')(e.target.value)}
              disabled={!open}
              placeholder="e.g. mornings only, or O-Level Physics and Maths at A-Level"
              className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Only institutes we have verified can search for teachers.
        </p>
        <Button type="submit" variant="gradient" size="lg" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save preferences
        </Button>
      </div>
    </form>
  );
}

function Num({
  id,
  label,
  value,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        // Every field this renders — both salary bounds and the notice period — is a quantity
        // that cannot be negative, so the floor belongs here rather than at three call sites.
        // Still overridable through props for any future field that needs a different one.
        min={0}
        value={value}
        // min={0} constrains the spinner but not the keyboard, and this form submits through
        // react-query rather than a native submit, so :invalid is never consulted. Dropping the
        // minus as it is typed is the only thing that actually prevents a negative reaching the API.
        onChange={(e) => onChange(noNegative(e.target.value))}
        className="mt-1.5"
        {...props}
      />
    </div>
  );
}
