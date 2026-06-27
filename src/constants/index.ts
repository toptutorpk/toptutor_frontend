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

/** The 7-step verification process — single source of truth for the trust UI. */
export const VERIFICATION_STEPS: Omit<VerificationStep, 'status'>[] = [
  {
    id: 1,
    label: 'Identity Verification',
    description: 'CNIC validated against NADRA records with biometric selfie match.',
  },
  {
    id: 2,
    label: 'Education Credential Check',
    description: 'Degrees & certificates manually verified with the issuing institution.',
  },
  {
    id: 3,
    label: 'Criminal Background Check',
    description: 'Third-party / government background check for child-safety assurance.',
  },
  {
    id: 4,
    label: 'Teaching Experience Proof',
    description: 'Experience letters and employment references confirmed.',
  },
  {
    id: 5,
    label: 'Subject Proficiency Test',
    description: 'Short online test per subject to validate knowledge level.',
  },
  {
    id: 6,
    label: 'Video Demo Session',
    description: '5-10 minute demo lesson reviewed for clarity & teaching quality.',
  },
  {
    id: 7,
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
