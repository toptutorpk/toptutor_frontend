import { http } from '@/api/client';
import type {
  AvailabilityTimeSlot,
  Certification,
  City,
  Education,
  Paginated,
  SearchFilters,
  SessionMode,
  SessionPackage,
  TeachingLanguage,
  Tutor,
  VerificationStatus,
  VerificationStep,
} from '@/types';

/* ============================================================================
   Tutor service — now backed by the REAL backend (public browse API).

   The listing/detail come from `/public/tutors…`, assembled from real profile
   data. Social-proof fields (rating, reviews, sessions, availability) have no
   data source yet, so they're returned empty and rendered as honest "New" /
   "No reviews yet" states rather than fabricated numbers.
   ========================================================================== */

// ---- Backend DTOs (mirror the Spring public API) ---------------------------
interface BackendCredential {
  title: string;
  org: string;
  year: string;
}
interface BackendVerificationStep {
  key: string;
  label: string;
  status: 'passed' | 'pending' | 'failed' | 'optional';
}
interface BackendCard {
  id: number;
  slug: string;
  name: string;
  headline?: string;
  institute?: string;
  photoUrl?: string;
  coverUrl?: string;
  verificationStatus: string;
  city?: string;
  area?: string;
  gender?: string;
  teachingLanguage?: string;
  experienceYears?: number;
  hourlyRate?: number;
  monthlyRate?: number;
  subjects?: string[];
  gradeLevels?: string[];
  modes?: string[];
  rating?: number | null;
  reviewCount?: number;
  online?: boolean;
  demoAvailable?: boolean;
}
interface BackendDetail extends BackendCard {
  availability?: { id: number; mode: string; start: string; end: string; booked: boolean }[];
  bio?: string;
  videoIntroUrl?: string;
  skills?: string[];
  education?: BackendCredential[];
  certifications?: BackendCredential[];
  courses?: { abbreviation: string; title: string }[];
  verificationSteps?: BackendVerificationStep[];
  totalSessions?: number;
  responseRate?: number | null;
  repeatHireRate?: number | null;
}
interface BackendPage {
  items: BackendCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Mapping to the frontend Tutor shape -----------------------------------
function mapVerification(status: string): VerificationStatus {
  // The frontend badge only models these four; a not-yet-started tutor maps to "under_review".
  return status === 'verified' || status === 'partial' || status === 'rejected'
    ? status
    : 'under_review';
}

/**
 * Pricing packages are a pure function of the tutor's real hourly rate (nothing fabricated).
 * Always returns the three tiers — the booking panel indexes packages[0], so it must be non-empty.
 */
function buildPackages(rate: number): SessionPackage[] {
  return [
    { id: 'pkg-single', title: 'Single Session', sessions: 1, pricePerSession: rate, totalPrice: rate, perks: ['1 hour live session', 'Homework help', 'Session notes'] },
    { id: 'pkg-weekly', title: 'Weekly Pack', sessions: 8, pricePerSession: Math.round(rate * 0.9), totalPrice: Math.round(rate * 0.9) * 8, popular: true, perks: ['8 sessions / month', '10% savings', 'Progress report', 'Priority scheduling'] },
    { id: 'pkg-intensive', title: 'Exam Intensive', sessions: 16, pricePerSession: Math.round(rate * 0.82), totalPrice: Math.round(rate * 0.82) * 16, perks: ['16 sessions', '18% savings', 'Mock tests'] },
  ];
}

function cardToTutor(c: BackendCard): Tutor {
  const rate = Number(c.hourlyRate ?? 0);
  return {
    id: String(c.id),
    slug: c.slug,
    name: c.name,
    headline: c.headline ?? '',
    avatarUrl: c.photoUrl ?? '',
    coverUrl: c.coverUrl ?? undefined,
    verificationStatus: mapVerification(c.verificationStatus),
    verificationSteps: [],
    rating: c.rating ?? 0,
    reviewCount: c.reviewCount ?? 0,
    subjects: c.subjects ?? [],
    gradeLevels: c.gradeLevels ?? [],
    languages: (c.teachingLanguage as TeachingLanguage) ?? 'Both',
    modes: (c.modes ?? []) as SessionMode[],
    city: (c.city as City) ?? ('Karachi' as City),
    area: c.area ?? '',
    gender: c.gender === 'female' ? 'female' : 'male',
    hourlyRate: rate,
    monthlyRate: c.monthlyRate != null ? Number(c.monthlyRate) : undefined,
    currency: 'PKR',
    bio: '',
    experienceYears: c.experienceYears ?? 0,
    // No activity data yet — kept at zero (rendered as honest empty states).
    responseRate: 0,
    repeatHireRate: 0,
    totalSessions: 0,
    // The card only needs the most recent institute (shown under the name); full education
    // is loaded on the detail page.
    education: c.institute ? [{ degree: '', institution: c.institute, year: '', verified: false }] : [],
    certifications: [],
    skills: [],
    packages: buildPackages(rate),
    availability: [],
    reviews: [],
    isPremium: false,
    isFavorite: false,
    isOnline: c.online ?? false,
    demoAvailable: c.demoAvailable ?? false,
  };
}

function detailToTutor(d: BackendDetail): Tutor {
  const verified = d.verificationStatus === 'verified';
  const education: Education[] = (d.education ?? []).map((e) => ({
    degree: e.title,
    institution: e.org,
    year: e.year,
    verified,
  }));
  const certifications: Certification[] = (d.certifications ?? []).map((c) => ({
    name: c.title,
    issuer: c.org,
    year: c.year,
    verified,
  }));
  const steps: VerificationStep[] = (d.verificationSteps ?? []).map((s, i) => ({
    id: i + 1,
    label: s.label,
    description: '',
    status: s.status,
  }));
  return {
    ...cardToTutor(d),
    bio: d.bio ?? '',
    videoIntroUrl: d.videoIntroUrl ?? undefined,
    skills: d.skills ?? [],
    education,
    certifications,
    courses: d.courses ?? [],
    verificationSteps: steps,
    responseRate: d.responseRate ?? 0,
    repeatHireRate: d.repeatHireRate ?? 0,
    totalSessions: d.totalSessions ?? 0,
    reviews: [],
    availabilitySlots: (d.availability ?? []).map((s) => ({
      id: s.id,
      mode: s.mode === 'HOME' ? 'HOME' : 'ONLINE',
      start: s.start,
      end: s.end,
      booked: s.booked,
    })) as AvailabilityTimeSlot[],
    demoAvailable: d.demoAvailable ?? false,
  };
}

/** Strips 'all'/'any'/empty sentinel values so they aren't sent as literal filters. */
function toParams(f: SearchFilters): Record<string, unknown> {
  const params: Record<string, unknown> = { page: f.page ?? 1, size: 9 };
  const put = (key: string, value: unknown) => {
    if (value !== undefined && value !== '' && value !== 'all' && value !== 'any') params[key] = value;
  };
  put('query', f.query);
  put('subject', f.subject);
  put('city', f.city);
  put('mode', f.mode);
  put('language', f.language);
  put('gender', f.gender);
  put('minPrice', f.minPrice);
  put('maxPrice', f.maxPrice);
  put('sort', f.sort);
  return params;
}

export const tutorService = {
  async list(filters: SearchFilters = {}): Promise<Paginated<Tutor>> {
    const page = await http.get<BackendPage>('/public/tutors', { params: toParams(filters) });
    return {
      items: page.items.map(cardToTutor),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
      totalPages: page.totalPages,
    };
  },

  async featured(): Promise<Tutor[]> {
    const cards = await http.get<BackendCard[]>('/public/tutors/featured', { params: { limit: 6 } });
    return cards.map(cardToTutor);
  },

  async getBySlug(slug: string): Promise<Tutor> {
    const detail = await http.get<BackendDetail>(`/public/tutors/${slug}`);
    return detailToTutor(detail);
  },
};
