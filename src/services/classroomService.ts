import { http } from '@/api/client';

/** Where to go to join a session — only ever returned to the session's tutor or learner, inside the window. */
export interface JoinResponse {
  meetingUri: string;
  /** ISO local date-time, Pakistan time, when the session ends. */
  closesAt: string;
  /** The session is set to be recorded. */
  recording: boolean;
}

export const classroomService = {
  /** POST: the server logs every join, so this is not a repeatable read. */
  join: (bookingId: number) => http.post<JoinResponse>(`/bookings/${bookingId}/join`),
};
