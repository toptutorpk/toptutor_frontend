import { ArrowRight, Clock, Loader2 } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import type { SessionPackage, Tutor } from '@/types';
import { formatDuration } from '@/services/availabilityService';
import { Button } from '@/components/ui/button';
import { type BookingDraft, formatDay, formatSlotRange } from './flow';
import { FinePrint, FlowHeader, Stepper } from './FlowChrome';
import type { SlotPicker } from './useSlotPicker';

export function ScheduleStep({
  tutor,
  pkg,
  picker,
  onContinue,
}: {
  tutor: Tutor;
  pkg: SessionPackage;
  picker: SlotPicker;
  onContinue: (draft: BookingDraft) => void;
}) {
  const { days, isLoading, date, setDate, selected, setSelected, minutes, setMinutes, lengthOptions, slots, total, draft } =
    picker;
  const firstName = tutor.name.split(' ')[0];

  return (
    <>
      <FlowHeader
        title={`Book ${pkg.title}`}
        subtitle={`${pkg.sessions > 1 ? `${pkg.sessions} × ` : ''}${minutes ? formatDuration(minutes) : 'live'} session${pkg.sessions > 1 ? 's' : ''} with ${tutor.name}`}
      />
      <Stepper current={0} />

      {isLoading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : days.length === 0 ? (
        <p className="rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
          {firstName} has no online times open in the next few weeks.{' '}
          {tutor.demoAvailable ? 'Try the free intro call.' : 'Try messaging them directly.'}
        </p>
      ) : (
        <div className="space-y-5">
          <Section label="Pick a date">
            {/* The scroller clips whatever paints outside its box, and the selected card's ring is a
                shadow outside the card. The padding gives the ring room; the negative margin keeps
                the cards aligned with the rest of the dialog. */}
            <div className="no-scrollbar -m-1 flex gap-2 overflow-x-auto p-1">
              {days.map((day) => {
                const d = new Date(`${day.date}T00:00:00`);
                const active = day.date === date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setDate(day.date)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition-colors',
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'hover:bg-secondary',
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                    </span>
                    <span className="font-display text-xl font-bold tabular-nums">{d.getDate()}</span>
                    <span className="text-[11px] opacity-80">
                      {d.toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {date && (
            <Section label="Pick a time">
              {/* The length governs which slots exist, so it sits above them. Hidden entirely
                  when the day only affords one length. */}
              {lengthOptions.length > 1 && minutes != null && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Session length</span>
                  {lengthOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinutes(m)}
                      aria-pressed={m === minutes}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                        m === minutes
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      {formatDuration(m)}
                    </button>
                  ))}
                </div>
              )}

              {slots.length === 0 ? (
                <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                  {minutes
                    ? `No ${formatDuration(minutes)} session fits ${firstName}’s hours on this day. Try a shorter length or another date.`
                    : `${firstName} has no window long enough to book on this day. Try another date.`}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((slot) => {
                    const active = selected?.start === slot.start && selected.weeklySlotId === slot.weeklySlotId;
                    return (
                      <button
                        key={`${slot.weeklySlotId}-${slot.start}`}
                        type="button"
                        onClick={() => setSelected(slot)}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition-colors',
                          active
                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                            : 'hover:bg-secondary',
                        )}
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        {formatSlotRange(slot.start, slot.end)}
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>
          )}
        </div>
      )}

      {/* The amount is the one thing in this row that must never be dropped, so the label is
          what yields when space is short. */}
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/40 p-3.5">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Selected</p>
          <p className="truncate text-sm font-semibold tabular-nums">
            {draft
              ? `${formatDay(draft.date)} · ${formatSlotRange(draft.slot.start, draft.slot.end)}`
              : 'Pick a date and time'}
          </p>
        </div>
        <span className="shrink-0 font-display text-xl font-extrabold tabular-nums">{formatPKR(total)}</span>
      </div>

      <div className="space-y-2">
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={!draft}
          onClick={() => draft && onContinue(draft)}
        >
          Continue to payment <ArrowRight className="h-4 w-4" />
        </Button>
        <FinePrint>Pay by card, Easypaisa, JazzCash or bank transfer on the next step</FinePrint>
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

