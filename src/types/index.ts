/* ============================================================================
   Domain types for TopTutor — derived from the TutorVerify PK PRD.
   ========================================================================== */

export type UserRole = 'student' | 'parent' | 'tutor' | 'institute' | 'admin';

export type VerificationStatus = 'verified' | 'partial' | 'under_review' | 'rejected';

export type TeachingLanguage = 'Urdu' | 'English' | 'Both';

export type SessionMode = 'online' | 'home_visit' | 'institute';

export type City =
  | 'Karachi'
  | 'Lahore'
  | 'Islamabad'
  | 'Rawalpindi'
  | 'Faisalabad'
  | 'Multan'
  | 'Peshawar'
  | 'Quetta';

export type GenderPreference = 'male' | 'female' | 'any';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  city?: City;
  createdAt: string;
}

/** One of the 7 verification steps from the PRD. */
export interface VerificationStep {
  id: number;
  label: string;
  description: string;
  status: 'passed' | 'pending' | 'failed' | 'optional';
}

export interface Review {
  id: string;
  tutorId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  subject?: string;
  progressPhotoUrl?: string;
  tutorResponse?: string;
  helpfulCount?: number;
}

export interface SessionPackage {
  id: string;
  title: string;
  sessions: number;
  pricePerSession: number;
  totalPrice: number;
  popular?: boolean;
  perks: string[];
}

export interface AvailabilitySlot {
  day: string; // e.g. "Mon"
  date: string; // ISO
  slots: { time: string; available: boolean }[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  verified: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
  verified: boolean;
}

export interface Tutor {
  id: string;
  slug: string;
  name: string;
  headline: string;
  avatarUrl: string;
  coverUrl?: string;
  videoIntroUrl?: string;
  verificationStatus: VerificationStatus;
  verificationSteps: VerificationStep[];
  rating: number;
  reviewCount: number;
  subjects: string[];
  gradeLevels: string[];
  languages: TeachingLanguage;
  modes: SessionMode[];
  city: City;
  area: string;
  gender: 'male' | 'female';
  hourlyRate: number;
  monthlyRate?: number;
  currency: 'PKR';
  bio: string;
  experienceYears: number;
  responseRate: number; // %
  repeatHireRate: number; // %
  totalSessions: number;
  education: Education[];
  certifications: Certification[];
  skills: string[];
  packages: SessionPackage[];
  availability: AvailabilitySlot[];
  reviews: Review[];
  isPremium?: boolean;
  isFavorite?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string; // lucide icon name
  tutorCount: number;
  category: string;
  gradient: string;
}

export interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
  mode: SessionMode;
  date: string;
  time: string;
  durationMins: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  amount: number;
  isTrial?: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  online?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  at: string;
  mine: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'review' | 'verification' | 'system';
  read: boolean;
  at: string;
}

export interface Stat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
}

export interface SearchFilters {
  query?: string;
  subject?: string;
  city?: City | 'all';
  mode?: SessionMode | 'all';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  gender?: GenderPreference;
  language?: TeachingLanguage | 'all';
  verifiedOnly?: boolean;
  sort?: 'relevance' | 'rating' | 'price_low' | 'price_high' | 'experience';
  page?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
