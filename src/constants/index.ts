import type { City, VerificationStep } from '@/types';

export const APP_NAME = 'TopTutor';
export const APP_TAGLINE = 'Verified Tutors You Can Trust';

export const CITIES: City[] = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
];

export const GRADE_LEVELS = [
  'Pre-School',
  'Primary (1-5)',
  'Middle (6-8)',
  'Matric (9-10)',
  'O-Levels',
  'Intermediate (11-12)',
  'A-Levels',
  'University',
  'Test Prep',
];

export const POPULAR_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Urdu',
  'Computer Science',
  'Accounting',
  'Economics',
  'Islamic Studies',
];

/** The 6-step verification process — single source of truth for the trust UI. */
export const VERIFICATION_STEPS: Omit<VerificationStep, 'status'>[] = [
  {
    id: 1,
    label: 'Identity Verification',
    description: 'CNIC number, issue date and both sides of the card checked against each other.',
  },
  {
    id: 2,
    label: 'Educational Background Check',
    description: 'Degrees & certificates manually verified with the issuing institution.',
  },
  {
    id: 3,
    label: 'Criminal Background Check',
    description: 'We run a criminal background check on every tutor for child-safety assurance.',
  },
  {
    id: 4,
    label: 'Teaching Experience Proof',
    description: 'Experience letters and employment references confirmed where provided.',
  },
  {
    id: 5,
    label: 'Introduction Video',
    description: '1-2 minute video reviewed to confirm a real person matching the CNIC photo.',
  },
  {
    id: 6,
    label: 'Admin Final Approval',
    description: 'Final human review of all documents before the Verified Badge is issued.',
  },
];

export const PRICE_BOUNDS = { min: 500, max: 8000, step: 250 } as const;

export const PAYMENT_METHODS = [
  { id: 'jazzcash', name: 'JazzCash', color: '#ED1C24' },
  { id: 'easypaisa', name: 'Easypaisa', color: '#00A651' },
  { id: 'card', name: 'Credit / Debit Card', color: '#1A1F71' },
] as const;
