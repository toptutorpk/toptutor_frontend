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

export interface TutorAvailability {
  modes: string[]; // profile teaching modes: online | home_visit | institute
  online: AvailabilityRange[];
  home: AvailabilityRange[];
  demoEnabled: boolean;
  demoSlot?: RangeInput | null;
}

export interface UpdateAvailability {
  online: RangeInput[];
  home: RangeInput[]; // tutor sends ranges; the server preserves booked slots
  demoEnabled: boolean;
  demoSlot?: RangeInput | null;
}

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

export const availabilityService = {
  getMine: () => http.get<TutorAvailability>('/tutors/availability'),
  updateMine: (body: UpdateAvailability) => http.put<TutorAvailability>('/tutors/availability', body),
  /** A student reserves a tutor's availability slot (online or home). */
  bookSlot: (slotId: number) => http.post<void>(`/tutors/slots/${slotId}/book`),
};
