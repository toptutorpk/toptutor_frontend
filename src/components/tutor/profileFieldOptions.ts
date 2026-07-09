import { Video, Home, Building2, type LucideIcon } from 'lucide-react';
import type { SessionMode, TeachingLanguage } from '@/types';

/* Option constants + types shared across the tutor profile UIs (onboarding
   wizard + dashboard editor). Kept separate from the component file so React
   Fast Refresh stays happy. */

export interface CredentialRow {
  title: string;
  org: string;
  year: string;
}

export const EMPTY_ROW: CredentialRow = { title: '', org: '', year: '' };

export const LANGUAGE_OPTIONS: TeachingLanguage[] = ['Urdu', 'English', 'Both'];

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const;

export const MODE_OPTIONS: { value: SessionMode; label: string; icon: LucideIcon }[] = [
  { value: 'online', label: 'Online', icon: Video },
  { value: 'home_visit', label: 'Home Visit', icon: Home },
  { value: 'institute', label: 'Institute', icon: Building2 },
];
