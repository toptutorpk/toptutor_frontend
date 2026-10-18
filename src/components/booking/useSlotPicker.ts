import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SessionPackage, Tutor } from '@/types';
import { priceForSession } from '@/services/bookingService';
import { availabilityService } from '@/services/availabilityService';
import type { BookingDraft, SessionSlot } from './flow';

/**
 * The schedule picker's state, lifted out of the view so it survives a trip to the payment step and
 * back ("Edit") without the learner having to choose everything again.
 *
 * <p>The tutor publishes a recurring window; the learner buys a slice of it on one date. The choices
 * offered are generated from the rules the server sends back with the slots (minimum length and grid
 * step), so the picker cannot offer a combination the server would then reject.
 */
export function useSlotPicker(tutor: Tutor, pkg: SessionPackage, enabled: boolean) {
  const [date, setDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<SessionSlot | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const packageId = pkg.id.replace('pkg-', '');

  // Only fetched once the dialog opens — the profile page shouldn't pay for a calendar nobody opened.
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'slots', tutor.id],
    queryFn: () => availabilityService.publicSlots(Number(tutor.id)),
    enabled,
  });

  const days = useMemo(() => data?.days ?? [], [data]);
  const activeDay = days.find((d) => d.date === date) ?? null;

  /** Lengths that fit inside at least one of the day's windows. */
  const lengthOptions = useMemo<number[]>(() => {
    if (!activeDay || !data) return [];
    const longest = activeDay.ranges.reduce(
      (max, r) => Math.max(max, toMinutes(r.end) - toMinutes(r.start)),
      0,
    );
    const lengths: number[] = [];
    for (let m = data.minSessionMinutes; m <= longest; m += data.granularityMinutes) lengths.push(m);
    return lengths;
  }, [activeDay, data]);

  /**
   * The day's windows cut into whole sessions of the chosen length.
   *
   * <p>Sessions run back to back from the start of each window, so what the learner picks is a
   * real appointment rather than an arbitrary offset into the tutor's hours. A window that does not
   * divide evenly simply stops offering slots once the remainder is too short to hold one — an
   * 80-minute window offers a single hour, not an hour and a stub.
   */
  const slots = useMemo<SessionSlot[]>(() => {
    if (!activeDay || !minutes) return [];
    const out: SessionSlot[] = [];
    for (const range of activeDay.ranges) {
      const end = toMinutes(range.end);
      for (let t = toMinutes(range.start); t + minutes <= end; t += minutes) {
        out.push({
          weeklySlotId: range.weeklySlotId,
          start: fromMinutes(t),
          end: fromMinutes(t + minutes),
        });
      }
    }
    return out.sort((a, b) => a.start.localeCompare(b.start));
  }, [activeDay, minutes]);

  // Open on the first bookable day rather than an empty prompt — one less tap for the common case.
  // Also re-runs when the slots refresh: a date that has since dropped out of the list (taken by
  // someone else, or now inside the notice window) must not stay selected with nothing showing it.
  useEffect(() => {
    if (date && days.some((d) => d.date === date)) return;
    setDate(days[0]?.date ?? null);
  }, [date, days]);

  // Keep the selection coherent as the learner moves back up the funnel.
  useEffect(() => {
    setSelected(null);
  }, [date]);

  // Settle on a length the day can actually accommodate, preserving the learner's own choice
  // whenever the new day still offers it rather than silently resetting them to the shortest.
  useEffect(() => {
    setMinutes((current) =>
      current && lengthOptions.includes(current) ? current : (lengthOptions[0] ?? null),
    );
  }, [lengthOptions]);

  // A slot only means anything alongside the length it was cut for.
  useEffect(() => {
    setSelected(null);
  }, [minutes]);

  const total = minutes ? priceForSession(tutor.hourlyRate, packageId, minutes) : pkg.totalPrice;
  const draft: BookingDraft | null =
    date && selected && minutes
      ? { tutor, pkg, packageId, date, slot: selected, minutes, total }
      : null;

  return {
    days,
    isLoading,
    date,
    setDate,
    selected,
    setSelected,
    minutes,
    setMinutes,
    lengthOptions,
    slots,
    total,
    draft,
  };
}

export type SlotPicker = ReturnType<typeof useSlotPicker>;

/** 'HH:MM' → minutes since midnight. */
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 870 → '14:30'. */
function fromMinutes(total: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
