import { http } from '@/api/client';

/** A weekly slot: day 0=Mon..6=Sun and an 'HH:MM' block start. */
export interface AvailSlot {
  day: number;
  time: string;
}

export interface TutorAvailability {
  modes: string[]; // profile teaching modes: online | home_visit | institute
  online: AvailSlot[];
  home: AvailSlot[];
  demoEnabled: boolean;
  demoSlot?: AvailSlot | null;
}

export interface UpdateAvailability {
  online: AvailSlot[];
  home: AvailSlot[];
  demoEnabled: boolean;
  demoSlot?: AvailSlot | null;
}

export const availabilityService = {
  getMine: () => http.get<TutorAvailability>('/tutors/availability'),
  updateMine: (body: UpdateAvailability) => http.put<TutorAvailability>('/tutors/availability', body),
};
