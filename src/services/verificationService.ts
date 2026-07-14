import { http } from '@/api/client';

export type SlotKind = 'image' | 'document' | 'video';
export type StepStatus = 'NOT_STARTED' | 'UNDER_REVIEW' | 'PASSED' | 'REJECTED';
export type DocStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface VerificationSlot {
  key: string;
  label: string;
  kind: SlotKind;
  required: boolean;
  url?: string;
  /** Per-document review state (undefined until uploaded). */
  status?: DocStatus;
  /** Reviewer feedback when the document was rejected. */
  reviewNotes?: string;
  /** True once approved — the tutor may no longer replace it. */
  locked: boolean;
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
  async submit(): Promise<VerificationView> {
    return http.post<VerificationView>('/verification/submit');
  },
};
