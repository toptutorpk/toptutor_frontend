import { http } from '@/api/client';

export type SlotKind = 'image' | 'document' | 'video';

/**
 * `IN_PROGRESS` means started but not yet submitted — a step holding draft uploads used to report
 * `NOT_STARTED`, which contradicted the file sitting on screen.
 *
 * <p>`FLAGGED` is the background check not clearing. Deliberately not `REJECTED`: a rejection asks
 * the tutor to correct something, and there is nothing here for them to correct.
 */
export type StepStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'UNDER_REVIEW'
  | 'PASSED'
  | 'REJECTED'
  | 'FLAGGED';
export type DocStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface VerificationSlot {
  key: string;
  label: string;
  /**
   * How to draw the slot, and nothing more — `image` is the card-sized box, `document` a row,
   * `video` a player. It says nothing about what the slot accepts: the payment receipt is a row
   * that still takes photographs only. Read {@link VerificationSlot.accept} for that.
   */
  kind: SlotKind;
  required: boolean;
  url?: string;
  /** Per-document review state (undefined until uploaded). */
  status?: DocStatus;
  /** Reviewer feedback when the document was rejected. */
  reviewNotes?: string;
  /** True once approved — the tutor may no longer replace it. */
  locked: boolean;
  /**
   * MIME types this slot takes, comma-separated, straight from the category the server validates
   * against — so the file picker can never offer something the upload will then refuse.
   */
  accept: string;
  /** Size cap for anything that is not a PDF, in bytes. */
  maxBytes: number;
  /** Size cap for a PDF, in bytes. Equal to `maxBytes` where the slot has a single limit. */
  pdfMaxBytes: number;
}

export interface VerificationStep {
  key: string;
  title: string;
  description: string;
  status: StepStatus;
  notes?: string;
  slots: VerificationSlot[];
}

export interface VerificationView {
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED';
  applicationStatus: ApplicationStatus;
  canSubmit: boolean;
  completedCount: number;
  totalSteps: number;
  steps: VerificationStep[];
  /** CNIC as typed into the Identity step, so the form reopens filled in. */
  cnicNumber?: string;
  /** ISO date the CNIC was issued. */
  cnicIssueDate?: string;
  /**
   * Whether the Identity step has been approved, settling the CNIC details.
   *
   * <p>The typed counterpart to a document's own `locked`: the number and issue date are what the
   * reviewer read the photographed card against, so approving the step approves them too.
   */
  identityLocked: boolean;
  /** What the tutor pays towards the background check we run for them, in PKR. */
  backgroundCheckFee: number;
}

export const verificationService = {
  /** The tutor's full verification state. */
  async get(): Promise<VerificationView> {
    return http.get<VerificationView>('/verification');
  },

  /** Uploads a document into a slot (stored in R2); returns the updated slot. */
  async uploadDocument(
    slotKey: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<VerificationSlot> {
    const form = new FormData();
    form.append('file', file);
    return http.upload<VerificationSlot>(`/verification/documents/${slotKey}`, form, onProgress);
  },

  /** Removes the document in a slot. */
  async removeDocument(slotKey: string): Promise<void> {
    await http.del<void>(`/verification/documents/${slotKey}`);
  },

  /** Submits the completed application for the admin's final review. */
  /**
   * Submits the application, carrying the CNIC details with it.
   *
   * <p>They travel with the submission rather than on their own save, so the whole application is
   * written in one transaction and cannot be sent with half of the Identity step filled in.
   */
  async submit(cnicNumber: string, cnicIssueDate: string): Promise<VerificationView> {
    return http.post<VerificationView>('/verification/submit', { cnicNumber, cnicIssueDate });
  },
};
