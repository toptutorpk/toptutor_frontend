import { http } from '@/api/client';
import type { DocStatus, SlotKind, StepStatus } from '@/services/verificationService';

/* ============================================================================
   Institute registration — the institute's own view of its file, and the admin
   review of it.

   Deliberately shaped like verificationService: the two flows are the same
   promise pointed in opposite directions, so the screens share components and
   the types share their step/slot vocabulary.
   ========================================================================== */

/**
 * Where an institute sits in registration.
 *
 * `APPLIED` covers both "not submitted yet" and "sent back for corrections" — a rejection is a list
 * of fixes, not a dead end, so there is no terminal rejected state. `statusNotes` carries what to
 * correct.
 */
export type InstituteStatus = 'APPLIED' | 'UNDER_REVIEW' | 'VERIFIED' | 'SUSPENDED';

export type InstituteEntityType =
  | 'COMPANY'
  | 'PARTNERSHIP'
  | 'SOCIETY'
  | 'TRUST'
  | 'SOLE_PROPRIETOR';

export interface InstituteSlot {
  key: string;
  label: string;
  kind: SlotKind;
  required: boolean;
  url?: string;
  status?: DocStatus;
  reviewNotes?: string;
  /** True once approved — the file can no longer be replaced. */
  locked: boolean;
  /** MIME types this slot takes, from the category the server validates against. */
  accept: string;
  maxBytes: number;
  pdfMaxBytes: number;
  /** When true the UI must collect an expiry date alongside the file. */
  expiring: boolean;
  /** ISO date this document lapses; absent when not applicable or not yet set. */
  expiresAt?: string;
}

export interface InstituteStep {
  key: string;
  title: string;
  description: string;
  status: StepStatus;
  notes?: string;
  slots: InstituteSlot[];
}

export interface InstituteVerificationView {
  accountStatus: InstituteStatus;
  /** Reviewer feedback on the account as a whole — what to fix after a rejection. */
  statusNotes?: string;
  canSubmit: boolean;
  completedCount: number;
  totalSteps: number;
  steps: InstituteStep[];
  /**
   * Whether the institute may post jobs, open full tutor profiles and send offers.
   *
   * <p>Gate hiring actions on this rather than re-deriving it from `accountStatus` in each screen —
   * one flag means one place to change when the rule does.
   */
  canHire: boolean;
}

export interface InstituteProfile {
  instituteId: number;
  legalName?: string;
  displayName?: string;
  entityType?: InstituteEntityType;
  registrationNo?: string;
  regulator?: string;
  about?: string;
  website?: string;
  contactPerson?: string;
  contactDesignation?: string;
  /** The authorised signatory's CNIC, canonical 12345-1234567-1. */
  contactCnic?: string;
  cityId?: number;
  cityName?: string;
  area?: string;
  address?: string;
  logoUrl?: string;
  coverUrl?: string;
  campusName?: string;
  studentCount?: number;
  status: InstituteStatus;
  statusNotes?: string;
  verifiedAt?: string;
  submittedAt?: string;
}

/** Everything an institute may edit. Omitted fields are left as they are. */
export type SaveInstituteProfile = Partial<
  Pick<
    InstituteProfile,
    | 'legalName'
    | 'displayName'
    | 'entityType'
    | 'registrationNo'
    | 'regulator'
    | 'about'
    | 'website'
    | 'contactPerson'
    | 'contactDesignation'
    | 'contactCnic'
    | 'cityId'
    | 'area'
    | 'address'
    | 'logoUrl'
    | 'coverUrl'
    | 'campusName'
    | 'studentCount'
  >
>;

export const instituteService = {
  /** The institute's own profile. Creates the empty row on first call. */
  async getProfile(): Promise<InstituteProfile> {
    return http.get<InstituteProfile>('/institute/profile');
  },

  async saveProfile(patch: SaveInstituteProfile): Promise<InstituteProfile> {
    return http.put<InstituteProfile>('/institute/profile', patch);
  },

  /** The registration file: catalogue structure merged with what has been uploaded. */
  async getVerification(): Promise<InstituteVerificationView> {
    return http.get<InstituteVerificationView>('/institute/verification');
  },

  /**
   * Uploads one registration document.
   *
   * @param expiresAt required for slots flagged `expiring`, such as the registration certificate
   */
  async uploadDocument(
    slotKey: string,
    file: File,
    expiresAt?: string,
    onProgress?: (percent: number) => void,
  ): Promise<InstituteSlot> {
    const form = new FormData();
    form.append('file', file);
    if (expiresAt) form.append('expiresAt', expiresAt);
    return http.upload<InstituteSlot>(
      `/institute/verification/documents/${slotKey}`,
      form,
      onProgress,
    );
  },

  async removeDocument(slotKey: string): Promise<void> {
    await http.del<void>(`/institute/verification/documents/${slotKey}`);
  },

  /** Submits the file for review. */
  async submit(): Promise<InstituteVerificationView> {
    return http.post<InstituteVerificationView>('/institute/verification/submit', {});
  },
};

/* ---------------------------------------------------------------------------
   Job posts.
   -------------------------------------------------------------------------- */

/**
 * There is no `EXPIRED`: a post past its closing date is `PUBLISHED` with `expired: true`, derived
 * on read. Storing it would mean two sources of truth for one fact.
 */
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'FILLED';

export interface JobPost {
  id: number;
  title: string;
  description?: string;
  employmentType?: EmploymentType;
  subjects?: string[];
  gradeLevels?: string[];
  cityId?: number;
  cityName?: string;
  area?: string;
  salaryMin?: number;
  salaryMax?: number;
  openings: number;
  startsOn?: string;
  closesOn?: string;
  status: JobStatus;
  /** Published but past its closing date, so no longer accepting applications. */
  expired: boolean;
  applicantCount: number;
  publishedAt?: string;
}

export interface SaveJobPost {
  title: string;
  description?: string;
  employmentType?: EmploymentType;
  subjects?: string[];
  gradeLevels?: string[];
  cityId?: number;
  area?: string;
  salaryMin?: number;
  salaryMax?: number;
  openings?: number;
  startsOn?: string;
  closesOn?: string;
}

export const jobPostService = {
  async list(): Promise<JobPost[]> {
    return http.get<JobPost[]>('/institute/jobs', { params: { size: 100 } });
  },

  async get(id: number): Promise<JobPost> {
    return http.get<JobPost>(`/institute/jobs/${id}`);
  },

  /** Creates a draft — only a title is required while it is being written. */
  async create(post: SaveJobPost): Promise<JobPost> {
    return http.post<JobPost>('/institute/jobs', post);
  },

  async update(id: number, post: SaveJobPost): Promise<JobPost> {
    return http.put<JobPost>(`/institute/jobs/${id}`, post);
  },

  /** Goes live. The completeness rules apply here, not on save. */
  async publish(id: number): Promise<JobPost> {
    return http.post<JobPost>(`/institute/jobs/${id}/publish`, {});
  },

  async close(id: number): Promise<JobPost> {
    return http.post<JobPost>(`/institute/jobs/${id}/close`, {});
  },

  async markFilled(id: number): Promise<JobPost> {
    return http.post<JobPost>(`/institute/jobs/${id}/filled`, {});
  },

  /** Drafts only — a published post is closed so applicants keep their record. */
  async remove(id: number): Promise<void> {
    await http.del<void>(`/institute/jobs/${id}`);
  },
};

/* ---------------------------------------------------------------------------
   Offers, placements and billing (Phase 2).
   -------------------------------------------------------------------------- */

/** No `EXPIRED`: an unanswered offer past its date is `OFFERED` with `expired: true`. */
export type OfferStatus = 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface Offer {
  id: number;
  instituteId: number;
  instituteName?: string;
  /** How to address their public page — `/institutes/{slug}`. */
  instituteSlug?: string;
  instituteLogo?: string;
  tutorId: number;
  tutorName: string;
  tutorPhotoUrl?: string;
  tutorSlug: string;
  jobPostId?: number;
  title: string;
  employmentType?: EmploymentType;
  /** A single figure, not a band — the placement fee is a share of it. */
  monthlySalary: number;
  startsOn?: string;
  message?: string;
  status: OfferStatus;
  expiresOn: string;
  expired: boolean;
  respondedAt?: string;
  createdAt: string;
}

export interface SendOffer {
  tutorId: number;
  applicationId?: number;
  title: string;
  employmentType?: EmploymentType;
  monthlySalary: number;
  startsOn?: string;
  message?: string;
  expiresInDays?: number;
}

export type PlacementStatus = 'PENDING_START' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface Placement {
  id: number;
  offerId: number;
  instituteId: number;
  instituteName?: string;
  tutorId: number;
  tutorName: string;
  tutorPhotoUrl?: string;
  title: string;
  monthlySalary: number;
  startsOn?: string;
  instituteConfirmed: boolean;
  tutorConfirmed: boolean;
  /** This viewer still has to confirm the start. */
  awaitingMe: boolean;
  status: PlacementStatus;
  endedOn?: string;
  endReason?: string;
  /** Institute only — a teacher never sees or pays the fee. */
  feeRate?: number;
  feeAmount?: number;
}

export type PlanTierKey = 'LISTED' | 'GROWTH' | 'INSTITUTION';

export interface Invoice {
  id: number;
  kind: 'PLAN' | 'PLACEMENT';
  description: string;
  amount: number;
  status: 'DUE' | 'PAID' | 'VOID';
  issuedOn: string;
  dueOn?: string;
}

export interface Billing {
  tier: PlanTierKey;
  tierLabel: string;
  monthlyPrice: number;
  /** Absent means unlimited — the server sends null rather than a sentinel. */
  activeJobPosts?: number;
  monthlyOffers?: number;
  offersUsed: number;
  placementFeeRate: number;
  renewsOn?: string;
  status: string;
  invoices: Invoice[];
  outstanding: number;
}

/** The institute's side: send offers, confirm placements, manage the plan. */
export const hiringService = {
  async offers(): Promise<Offer[]> {
    return http.get<Offer[]>('/institute/offers', { params: { size: 100 } });
  },
  async sendOffer(offer: SendOffer): Promise<Offer> {
    return http.post<Offer>('/institute/offers', offer);
  },
  async withdrawOffer(id: number): Promise<Offer> {
    return http.post<Offer>(`/institute/offers/${id}/withdraw`, {});
  },

  async placements(): Promise<Placement[]> {
    return http.get<Placement[]>('/institute/placements', { params: { size: 100 } });
  },
  /** The second confirmation is what raises the placement fee. */
  async confirmPlacement(id: number): Promise<Placement> {
    return http.post<Placement>(`/institute/placements/${id}/confirm`, {});
  },
  async endPlacement(id: number, reason?: string): Promise<Placement> {
    return http.post<Placement>(`/institute/placements/${id}/end`, { reason });
  },
  async cancelPlacement(id: number, reason: string): Promise<Placement> {
    return http.post<Placement>(`/institute/placements/${id}/cancel`, { reason });
  },

  async billing(): Promise<Billing> {
    return http.get<Billing>('/institute/billing');
  },
  async changeTier(tier: PlanTierKey): Promise<Billing> {
    return http.post<Billing>('/institute/billing/tier', { tier });
  },
  async cancelPlan(): Promise<Billing> {
    return http.post<Billing>('/institute/billing/cancel', {});
  },
};

/** The teacher's side: offers received and placements they are part of. */
export const tutorOfferService = {
  async offers(): Promise<Offer[]> {
    return http.get<Offer[]>('/tutors/offers', { params: { size: 100 } });
  },
  /** Accepting creates the placement. */
  async respond(id: number, accept: boolean): Promise<Offer> {
    return http.post<Offer>(`/tutors/offers/${id}/respond`, { accept });
  },
  async placements(): Promise<Placement[]> {
    return http.get<Placement[]>('/tutors/placements', { params: { size: 100 } });
  },
  async confirmPlacement(id: number): Promise<Placement> {
    return http.post<Placement>(`/tutors/placements/${id}/confirm`, {});
  },
};

/* ---------------------------------------------------------------------------
   Applications — the two sides of one object.
   -------------------------------------------------------------------------- */

/**
 * `SHORTLISTED` and `ACCEPTED` are separate on purpose: shortlisting is the institute asking,
 * accepting is the teacher agreeing. Only the second unlocks credential documents.
 */
export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'REJECTED'
  | 'WITHDRAWN';

/** A live job as a teacher browsing sees it. Carries no way to contact the institute off-platform. */
export interface OpenJob {
  id: number;
  title: string;
  description?: string;
  instituteName?: string;
  /** How to address their public page — `/institutes/{slug}`. */
  instituteSlug?: string;
  instituteLogo?: string;
  employmentType?: EmploymentType;
  subjects?: string[];
  gradeLevels?: string[];
  cityName?: string;
  area?: string;
  salaryMin?: number;
  salaryMax?: number;
  openings: number;
  startsOn?: string;
  closesOn?: string;
  publishedAt?: string;
  /** This teacher's status on the job, absent if they have not applied. */
  myStatus?: ApplicationStatus;
}

export interface OpenJobPage {
  items: OpenJob[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MyApplication {
  applicationId: number;
  jobId: number;
  jobTitle: string;
  instituteName?: string;
  /** How to address their public page — `/institutes/{slug}`. */
  instituteSlug?: string;
  instituteLogo?: string;
  cityName?: string;
  salaryMin?: number;
  salaryMax?: number;
  coverNote?: string;
  status: ApplicationStatus;
  instituteNote?: string;
  appliedAt?: string;
  /** Shortlisted and waiting on this teacher to accept or decline. */
  needsResponse: boolean;
}

/** One applicant as the hiring institute sees them — no contact details, no document URLs. */
export interface Applicant {
  applicationId: number;
  tutorId: number;
  slug: string;
  name: string;
  headline?: string;
  photoUrl?: string;
  city?: string;
  experienceYears?: number;
  subjects?: string[];
  rating?: number;
  reviewCount: number;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  earliestStart?: string;
  coverNote?: string;
  status: ApplicationStatus;
  instituteNote?: string;
  appliedAt?: string;
  /** True once the teacher accepted the shortlist — the point credentials may be requested. */
  credentialsUnlocked: boolean;
}

/** The teacher's side: browse live jobs, apply, and answer shortlists. */
export const jobFeedService = {
  async feed(filters: {
    cityId?: number;
    subject?: string;
    employmentType?: EmploymentType;
    page?: number;
    size?: number;
  } = {}): Promise<OpenJobPage> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const query = params.toString();
    return http.get<OpenJobPage>(`/tutors/jobs${query ? `?${query}` : ''}`);
  },

  async apply(jobId: number, coverNote?: string): Promise<MyApplication> {
    return http.post<MyApplication>(`/tutors/jobs/${jobId}/apply`, { coverNote });
  },

  async myApplications(): Promise<MyApplication[]> {
    return http.get<MyApplication[]>('/tutors/jobs/applications', { params: { size: 100 } });
  },

  async withdraw(applicationId: number): Promise<MyApplication> {
    return http.post<MyApplication>(`/tutors/jobs/applications/${applicationId}/withdraw`, {});
  },

  /** Accepting is what lets the institute review this teacher's credentials. */
  async respond(applicationId: number, accept: boolean): Promise<MyApplication> {
    return http.post<MyApplication>(`/tutors/jobs/applications/${applicationId}/respond`, {
      accept,
    });
  },
};

/** The institute's side: who applied, and moving them along. */
export const applicantService = {
  async forJob(jobId: number): Promise<Applicant[]> {
    return http.get<Applicant[]>(`/institute/jobs/${jobId}/applicants`, { params: { size: 100 } });
  },

  async shortlist(applicationId: number, note?: string): Promise<Applicant> {
    return http.post<Applicant>(`/institute/jobs/applications/${applicationId}/shortlist`, { note });
  },

  async reject(applicationId: number, note?: string): Promise<Applicant> {
    return http.post<Applicant>(`/institute/jobs/applications/${applicationId}/reject`, { note });
  },

  /**
   * Decides several applicants at once.
   *
   * <p>Partial success by design: a batch where one applicant has already withdrawn still puts the
   * rest through, and `skipped` names the ones it left alone. Always read `skipped` — an empty
   * `updated` with a full `skipped` is a request that changed nothing.
   */
  async decideAll(
    applicationIds: number[],
    shortlist: boolean,
    note?: string,
  ): Promise<BulkDecision> {
    return http.post<BulkDecision>('/institute/jobs/applications/bulk', {
      applicationIds,
      shortlist,
      note,
    });
  },

  /**
   * The teacher's verified documents.
   *
   * <p>The server refuses unless the teacher accepted the shortlist, so this is safe to call
   * whenever `credentialsUnlocked` is true and will fail loudly if it is not.
   */
  async credentials(applicationId: number): Promise<Credential[]> {
    return http.get<Credential[]>(
      `/institute/jobs/applications/${applicationId}/credentials`,
    );
  },
};

/** The outcome of one bulk shortlist or decline. */
export interface BulkDecision {
  /** What changed — ready to replace the rows on screen. */
  updated: Applicant[];
  /** What did not, and why, in words meant for the institute. */
  skipped: { applicationId: number; reason: string }[];
}

/** One released document. Only APPROVED ones are returned. */
export interface Credential {
  slotKey: string;
  label: string;
  url: string;
  contentType?: string;
}

/* ---------------------------------------------------------------------------
   The teacher database an institute searches.
   -------------------------------------------------------------------------- */

/**
 * A teacher as an institute sees them in search.
 *
 * <p>What is absent is deliberate: no phone, no email, no address, no credential documents. Those
 * unlock later — contact once an offer is accepted, documents once the teacher accepts a shortlist.
 */
export interface TeacherCard {
  tutorId: number;
  slug: string;
  name: string;
  headline?: string;
  photoUrl?: string;
  city?: string;
  area?: string;
  experienceYears?: number;
  languages?: string;
  subjects?: string[];
  gradeLevels?: string[];
  rating?: number;
  reviewCount: number;
  employmentType?: EmploymentType;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  earliestStart?: string;
  noticePeriodDays?: number;
  hiringNote?: string;
}

export interface TeacherPage {
  items: TeacherCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TeacherFilters {
  q?: string;
  subject?: string;
  cityId?: number;
  employmentType?: EmploymentType;
  /** The most the institute will pay per month; matches teachers whose band starts at or below it. */
  salaryMax?: number;
  availableFrom?: string;
  minExperience?: number;
  page?: number;
  size?: number;
}

export const teacherSearchService = {
  /** Verified, opted-in teachers only. Refuses unless the institute itself is verified. */
  async search(filters: TeacherFilters = {}): Promise<TeacherPage> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const query = params.toString();
    return http.get<TeacherPage>(`/institute/teachers${query ? `?${query}` : ''}`);
  },

  /**
   * Opens (or re-opens) a chat with a teacher and returns the conversation id.
   *
   * <p>Idempotent — asking twice lands on the same thread rather than a second one, so the button
   * can stay enabled without the institute accumulating duplicate conversations.
   */
  async startChat(tutorId: number): Promise<number> {
    const res = await http.post<{ conversationId: number }>('/institute/conversations', { tutorId });
    return res.conversationId;
  },
};

/* ---------------------------------------------------------------------------
   Tutor side of institute hiring — the consent that fills the teacher database.
   -------------------------------------------------------------------------- */

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'VISITING';

export interface HiringPreference {
  /**
   * Whether institutes may approach this tutor.
   *
   * <p>Distinct from having `institute` among teaching modes: that says "I will teach at an
   * institute", this says "employers may contact me". Defaults to false — silence is not consent,
   * so the database starts empty and fills only with tutors who opted in.
   */
  openToInstituteRoles: boolean;
  employmentType?: EmploymentType;
  /** Monthly band in PKR — a range, so filtering works without publishing one negotiable figure. */
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  /** ISO date they could actually begin. */
  earliestStart?: string;
  noticePeriodDays?: number;
  note?: string;
}

export type SaveHiringPreference = HiringPreference;

export const hiringPreferenceService = {
  /** The signed-in tutor's preferences; opted-out defaults if never set. */
  async get(): Promise<HiringPreference> {
    return http.get<HiringPreference>('/tutors/hiring-preference');
  },

  async save(preference: SaveHiringPreference): Promise<HiringPreference> {
    return http.put<HiringPreference>('/tutors/hiring-preference', preference);
  },
};

/**
 * One institute's whole file, as the reviewer sees it.
 *
 * <p>Shaped like the tutor's `AdminTutorDetail` so the two review screens can be read the same
 * way — they are the same job: check the documents, then decide.
 */
export interface AdminInstituteDetail {
  profile: InstituteProfile;
  verification: InstituteVerificationView;
}

/** Admin-side review of institute registrations. */
export const adminInstituteService = {
  /** The queue for one status; the server defaults to what is waiting to be reviewed. */
  async queue(status?: InstituteStatus): Promise<InstituteProfile[]> {
    const query = status ? `?status=${status}` : '';
    return http.getAllPages<InstituteProfile>(`/admin/institutes${query}`);
  },

  async get(instituteId: number): Promise<InstituteProfile> {
    return http.get<InstituteProfile>(`/admin/institutes/${instituteId}`);
  },

  /**
   * Profile plus the registration file.
   *
   * <p>What the review screen loads. `get` returns the typed profile alone, which is enough for a
   * queue row and not enough to decide on — approving an institute means looking at its
   * registration certificate, not at the legal name someone typed above it.
   */
  async detail(instituteId: number): Promise<AdminInstituteDetail> {
    return http.get<AdminInstituteDetail>(`/admin/institutes/${instituteId}/detail`);
  },

  /** Approve or reject one uploaded document, as the tutor review screen does. */
  async reviewDocument(
    instituteId: number,
    slotKey: string,
    approve: boolean,
    notes?: string,
  ): Promise<InstituteSlot> {
    return http.post<InstituteSlot>(
      `/admin/institutes/${instituteId}/documents/${slotKey}/decision`,
      { approve, notes },
    );
  },

  /** Approve, or send back with notes saying what to fix. */
  async decide(instituteId: number, approve: boolean, notes?: string): Promise<InstituteProfile> {
    return http.post<InstituteProfile>(`/admin/institutes/${instituteId}/decision`, {
      approve,
      notes,
    });
  },

  async suspend(instituteId: number, notes: string): Promise<InstituteProfile> {
    return http.post<InstituteProfile>(`/admin/institutes/${instituteId}/suspend`, { notes });
  },
};

/* ---------------------------------------------------------------------------
   Admin financial view — what the hiring module earns, across every institute.
   -------------------------------------------------------------------------- */

export type InvoiceKind = 'PLAN' | 'PLACEMENT';
export type InvoiceStatus = 'DUE' | 'PAID' | 'VOID';

export interface AdminInvoice {
  id: number;
  instituteId: number;
  instituteName: string;
  kind: InvoiceKind;
  description: string;
  amount: number;
  status: InvoiceStatus;
  /** Past its due date — computed by the server on read, never a stored status. */
  overdue: boolean;
  issuedOn: string;
  dueOn?: string;
}

export interface AdminFinance {
  /** Every non-void charge ever raised, PKR. */
  billed: number;
  collected: number;
  outstanding: number;
  /** The part of `outstanding` already past due. */
  overdue: number;
  overdueCount: number;
  planRevenue: number;
  placementRevenue: number;
  tiers: { tier: PlanTierKey; label: string; active: number; cancelled: number }[];
  placements: { status: PlacementStatus; count: number; feeTotal: number }[];
  invoices: AdminInvoice[];
}

export const adminFinanceService = {
  async overview(): Promise<AdminFinance> {
    return http.get<AdminFinance>('/admin/institute-billing');
  },

  async invoices(filters: { status?: InvoiceStatus; kind?: InvoiceKind } = {}): Promise<AdminInvoice[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.kind) params.set('kind', filters.kind);
    const query = params.toString();
    return http.getAllPages<AdminInvoice>(`/admin/institute-billing/invoices${query ? `?${query}` : ''}`);
  },

  /** Records an off-platform payment — a school pays by transfer, not through checkout. */
  async markPaid(invoiceId: number): Promise<AdminInvoice> {
    return http.post<AdminInvoice>(`/admin/institute-billing/invoices/${invoiceId}/paid`, {});
  },

  async voidInvoice(invoiceId: number): Promise<AdminInvoice> {
    return http.post<AdminInvoice>(`/admin/institute-billing/invoices/${invoiceId}/void`, {});
  },
};

/* ---------------------------------------------------------------------------
   The public institute page — no auth, verified institutes only.
   -------------------------------------------------------------------------- */

export interface PublicInstituteJob {
  id: number;
  title: string;
  employmentType?: EmploymentType;
  subjects?: string[];
  cityName?: string;
  area?: string;
  salaryMin?: number;
  salaryMax?: number;
  openings: number;
  closesOn?: string;
}

/**
 * A verified institute as anyone may see it.
 *
 * Narrower than `InstituteProfile` on purpose: registration number, contact person and street
 * address stay behind the login. An institute that is not verified has no page at all — the server
 * answers 404, not 403.
 */
export interface PublicInstitute {
  instituteId: number;
  slug: string;
  name: string;
  /** Only present when the registered entity differs from what they trade as. */
  legalName?: string;
  entityType?: InstituteEntityType;
  about?: string;
  website?: string;
  cityName?: string;
  area?: string;
  logoUrl?: string;
  coverUrl?: string;
  campusName?: string;
  studentCount?: number;
  regulator?: string;
  verifiedAt?: string;
  openJobs: PublicInstituteJob[];
}

export const publicInstituteService = {
  async get(slug: string): Promise<PublicInstitute> {
    return http.get<PublicInstitute>(`/public/institutes/${encodeURIComponent(slug)}`);
  },
};

/* ---------------------------------------------------------------------------
   Phase 3 — digital contracts and payroll through escrow.
   -------------------------------------------------------------------------- */

/**
 * Where a contract is between being written and being binding.
 *
 * `DRAFT` is the institute's private working copy — a teacher never sees one. `VOID` is a contract
 * withdrawn or declined before it was countersigned; a signed contract is never voided, because it
 * is a record of something that happened.
 */
export type ContractStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'VOID';

export interface Contract {
  id: number;
  placementId: number;
  instituteId: number;
  instituteName?: string;
  instituteSlug?: string;
  tutorId: number;
  tutorName?: string;
  title: string;
  monthlySalary: number;
  startsOn?: string;
  workingHours?: string;
  probationMonths?: number;
  noticePeriodDays?: number;
  duties?: string;
  extraTerms?: string;
  status: ContractStatus;
  instituteSignedAt?: string;
  instituteSignerName?: string;
  tutorSignedAt?: string;
  tutorSignerName?: string;
  voidReason?: string;
  /** Whether the reader may still change the terms. */
  editable: boolean;
  /** Whether the reader is the one being asked to sign. */
  myTurn: boolean;
  createdAt: string;
}

export interface SaveContract {
  title: string;
  monthlySalary: number;
  startsOn?: string;
  workingHours?: string;
  probationMonths?: number;
  noticePeriodDays?: number;
  duties?: string;
  extraTerms?: string;
}

export const contractService = {
  async list(): Promise<Contract[]> {
    return http.get<Contract[]>('/institute/contracts', { params: { size: 100 } });
  },

  /** Starts (or reopens) the contract for a placement, pre-filled from its terms. Idempotent. */
  async createFor(placementId: number): Promise<Contract> {
    return http.post<Contract>(`/institute/contracts/placements/${placementId}`, {});
  },

  async update(id: number, terms: SaveContract): Promise<Contract> {
    return http.put<Contract>(`/institute/contracts/${id}`, terms);
  },

  /** Signs as the employer and sends it. `signerName` is the typed signature. */
  async sign(id: number, signerName: string): Promise<Contract> {
    return http.post<Contract>(`/institute/contracts/${id}/sign`, { signerName });
  },

  async withdraw(id: number, reason?: string): Promise<Contract> {
    return http.post<Contract>(`/institute/contracts/${id}/withdraw`, { reason });
  },
};

export const tutorContractService = {
  async list(): Promise<Contract[]> {
    return http.get<Contract[]>('/tutors/contracts', { params: { size: 100 } });
  },

  async sign(id: number, signerName: string): Promise<Contract> {
    return http.post<Contract>(`/tutors/contracts/${id}/sign`, { signerName });
  },

  async decline(id: number, reason?: string): Promise<Contract> {
    return http.post<Contract>(`/tutors/contracts/${id}/decline`, { reason });
  },
};

/**
 * Where one month of salary sits.
 *
 * `FUNDED` is the state the feature exists for — the institute has paid and the platform is
 * holding it, so the teacher can see the month is secured before they work it.
 */
export type PayrollStatus = 'DUE' | 'FUNDED' | 'RELEASED' | 'CANCELLED';

/**
 * One month of a placement's salary.
 *
 * The two sides see different money on purpose: an institute gets `gross` and `platformFee`, a
 * teacher gets `tutorNet`. Whichever side you are, the other's figures are simply absent.
 */
export interface PayrollCycle {
  id: number;
  placementId: number;
  title: string;
  /** The other side's display name. */
  counterparty?: string;
  /** `YYYY-MM`. */
  period: string;
  periodLabel: string;
  gross?: number;
  platformFee?: number;
  tutorNet?: number;
  status: PayrollStatus;
  fundedAt?: string;
  releasedAt?: string;
  note?: string;
}

export const payrollService = {
  async list(): Promise<PayrollCycle[]> {
    return http.get<PayrollCycle[]>('/institute/payroll', { params: { size: 100 } });
  },

  /** @param gross omit to use the signed contract's monthly salary */
  async raise(
    placementId: number,
    period: string,
    gross?: number,
    note?: string,
  ): Promise<PayrollCycle> {
    return http.post<PayrollCycle>('/institute/payroll', { placementId, period, gross, note });
  },

  async fund(id: number): Promise<PayrollCycle> {
    return http.post<PayrollCycle>(`/institute/payroll/${id}/fund`, {});
  },

  async release(id: number): Promise<PayrollCycle> {
    return http.post<PayrollCycle>(`/institute/payroll/${id}/release`, {});
  },

  async cancel(id: number, reason?: string): Promise<PayrollCycle> {
    return http.post<PayrollCycle>(`/institute/payroll/${id}/cancel`, { reason });
  },
};

/** Read-only: the institute funds and releases, so a teacher has no action here. */
export const tutorPayrollService = {
  async list(): Promise<PayrollCycle[]> {
    return http.get<PayrollCycle[]>('/tutors/payroll', { params: { size: 100 } });
  },
};
