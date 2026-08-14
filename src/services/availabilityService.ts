import { http } from '@/api/client';

/** A time range input the tutor sets: 'HH:MM' start → end. */
export interface RangeInput {
  start: string;
  end: string;
}

/** A stored availability slot (a time range) with its booked state. */
export interface AvailabilityRange {
  id: number;
  start: string;
  end: string;
  booked: boolean;
}

/**
 * Home-visit and demo availability. Online availability is NOT here — it recurs weekly and is booked
 * per date, so it has its own endpoints below.
 */
export interface TutorAvailability {
  modes: string[]; // profile teaching modes: online | home_visit | institute
  home: AvailabilityRange[];
  demoEnabled: boolean;
  demoSlot?: RangeInput | null;
}

export interface UpdateAvailability {
  home: RangeInput[]; // tutor sends ranges; the server preserves booked slots
  demoEnabled: boolean;
  demoSlot?: RangeInput | null;
}

// ---- Recurring weekly online availability ----------------------------------

export type WeekdayName =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type SlotType = 'AVAILABLE' | 'UNAVAILABLE';

/** One recurring window. It repeats every week on `dayOfWeek` until `endDate` (if set). */
export interface WeeklySlot {
  id: number;
  dayOfWeek: WeekdayName;
  start: string;
  end: string;
  type: SlotType;
  endDate?: string | null;
  note?: string | null;
}

export interface AddWeeklySlot {
  days: WeekdayName[];
  start: string;
  end: string;
  type: SlotType;
  endDate?: string | null;
  note?: string | null;
}

/**
 * What a block on the calendar is.
 * - `AVAILABLE` — open for booking
 * - `BOOKED` — a learner has this time
 * - `BLOCKED` — a leftover too short to sell (real time, but unbookable)
 * - `UNAVAILABLE` — the tutor's own recurring block-out
 */
export type CalendarEntryStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'UNAVAILABLE';

export interface CalendarEntry {
  weeklySlotId: number;
  start: string;
  end: string;
  status: CalendarEntryStatus;
  past: boolean;
  /** Server-decided: only ever true for a paid session, today, inside the join window. */
  joinable: boolean;
  note?: string | null;
  bookingId?: number;
  studentId?: number;
  studentName?: string;
  studentAvatar?: string;
  /** False while the learner is still at checkout and merely holding the time. */
  paid?: boolean;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: WeekdayName;
  today: boolean;
  past: boolean;
  entries: CalendarEntry[];
}

export interface TutorCalendar {
  from: string;
  to: string;
  timezone: string;
  /** "Now" in the business timezone — the anchor for the red current-time line. */
  serverNow: string;
  days: CalendarDay[];
}

// ---- What learners can book -------------------------------------------------

export interface PublicSlotRange {
  weeklySlotId: number;
  start: string;
  end: string;
  minutes: number;
}

export interface PublicSlotDay {
  date: string;
  dayOfWeek: WeekdayName;
  ranges: PublicSlotRange[];
}

export interface PublicAvailability {
  from: string;
  to: string;
  timezone: string;
  /** Shortest session a learner may book. */
  minSessionMinutes: number;
  /** Grid that start times and durations snap to. */
  granularityMinutes: number;
  days: PublicSlotDay[];
}

// ---- formatting -------------------------------------------------------------

/** '09:00' → '9:00 AM'. */
export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** '09:00'–'11:00' → '9:00 AM – 11:00 AM'. */
export function formatRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** 'HH:MM' → minutes since midnight, for positioning blocks on the grid. */
export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 90 → '1h 30m'. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const availabilityService = {
  getMine: () => http.get<TutorAvailability>('/tutors/availability'),
  updateMine: (body: UpdateAvailability) => http.put<TutorAvailability>('/tutors/availability', body),
  /** A student reserves a tutor's home-visit slot (online goes through the paid booking flow). */
  bookSlot: (slotId: number) => http.post<void>(`/tutors/slots/${slotId}/book`),

  /** The tutor's recurring weekly online windows. */
  weekly: {
    list: () => http.get<WeeklySlot[]>('/tutors/weekly-availability'),
    add: (body: AddWeeklySlot) => http.post<WeeklySlot[]>('/tutors/weekly-availability', body),
    remove: (id: number) => http.del<WeeklySlot[]>(`/tutors/weekly-availability/${id}`),
    /** Those windows landed on real dates, with bookings subtracted. Serves week and day views alike. */
    calendar: (from: string, to: string) =>
      http.get<TutorCalendar>(`/tutors/weekly-availability/calendar?from=${from}&to=${to}`),
  },

  /** A tutor's bookable online time, for the booking panel. Public — no auth needed. */
  publicSlots: (tutorId: number, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString();
    return http.get<PublicAvailability>(
      `/public/tutors/${tutorId}/slots${query ? `?${query}` : ''}`,
    );
  },
};
