import { http } from '@/api/client';

/** What a misconduct report is about. Mirrors the backend's ReportCategory. */
export type ReportCategory =
  | 'CHILD_SAFETY'
  | 'HARASSMENT'
  | 'FRAUD'
  | 'FAKE_CREDENTIALS'
  | 'OFF_PLATFORM'
  | 'INAPPROPRIATE_CONTENT'
  | 'DISCRIMINATION'
  | 'OTHER';

/** Where it happened. Optional — a reporter who cannot remember still has a report worth filing. */
export type ReportChannel =
  | 'CHAT'
  | 'SESSION'
  | 'LISTING'
  | 'PAYMENT'
  | 'OFF_PLATFORM'
  | 'OTHER';

export type ReportSubjectRole = 'TUTOR' | 'STUDENT' | 'PARENT' | 'INSTITUTE' | 'UNKNOWN';

export interface MisconductReport {
  category: ReportCategory;
  description: string;
  subjectName?: string;
  subjectRole?: ReportSubjectRole;
  subjectProfileUrl?: string;
  channel?: ReportChannel;
  /** ISO date (yyyy-MM-dd). The server rejects a future date. */
  occurredOn?: string;
  // Deliberately nothing about the reporter. Who they are comes from the session, and their
  // name, email and phone are read from their account — a payload field claiming to be someone's
  // email is only a claim, and the team needs the one detail that has to be right to be right.
}

export interface MisconductReceipt {
  reference: string;
  /** True for the categories the safety team is paged about rather than queueing. */
  urgent: boolean;
}

/**
 * The reporter's own details as the form shows them.
 *
 * <p>`email` and `phone` arrive already masked. The unmasked values are never sent to the
 * browser, so this cannot be undone by reading the network tab — which is the difference between
 * a control and a decoration.
 */
export interface ReporterContact {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export const reportService = {
  /** The signed-in reporter's masked contact details, for the "we will contact you at" panel. */
  async myContact(): Promise<ReporterContact> {
    return http.get<ReporterContact>('/reports/me/contact');
  },

  /**
   * Files a misconduct report.
   *
   * <p>Never mocked, unlike most services here. A safety form that silently succeeds against a
   * stub is worse than one that is plainly broken: someone would believe they had reported
   * something serious when nothing had been sent anywhere.
   *
   * <p>Requires a signed-in account — the shared client attaches the token, and the server reads
   * the reporter from it rather than from the payload. Callers gate the form on auth so nobody
   * fills it in only to be refused.
   */
  async submit(payload: MisconductReport): Promise<MisconductReceipt> {
    return http.post<MisconductReceipt>('/reports/misconduct', payload);
  },
};
