import type { Subject } from '@/types';

export const SUBJECTS: Subject[] = [
  { id: 's1', name: 'Mathematics', slug: 'mathematics', icon: 'Sigma', tutorCount: 1240, category: 'Sciences', gradient: 'from-blue-500 to-indigo-600' },
  { id: 's2', name: 'Physics', slug: 'physics', icon: 'Atom', tutorCount: 860, category: 'Sciences', gradient: 'from-violet-500 to-purple-600' },
  { id: 's3', name: 'Chemistry', slug: 'chemistry', icon: 'FlaskConical', tutorCount: 740, category: 'Sciences', gradient: 'from-emerald-500 to-teal-600' },
  { id: 's4', name: 'Biology', slug: 'biology', icon: 'Dna', tutorCount: 690, category: 'Sciences', gradient: 'from-green-500 to-emerald-600' },
  { id: 's5', name: 'English', slug: 'english', icon: 'BookOpenText', tutorCount: 1530, category: 'Languages', gradient: 'from-rose-500 to-pink-600' },
  { id: 's6', name: 'Urdu', slug: 'urdu', icon: 'Languages', tutorCount: 980, category: 'Languages', gradient: 'from-amber-500 to-orange-600' },
  { id: 's7', name: 'Computer Science', slug: 'computer-science', icon: 'Code2', tutorCount: 1120, category: 'Technology', gradient: 'from-cyan-500 to-blue-600' },
  { id: 's8', name: 'Accounting', slug: 'accounting', icon: 'Calculator', tutorCount: 520, category: 'Commerce', gradient: 'from-slate-500 to-gray-700' },
  { id: 's9', name: 'Economics', slug: 'economics', icon: 'TrendingUp', tutorCount: 470, category: 'Commerce', gradient: 'from-teal-500 to-cyan-600' },
  { id: 's10', name: 'Islamic Studies', slug: 'islamic-studies', icon: 'BookMarked', tutorCount: 610, category: 'Humanities', gradient: 'from-green-600 to-teal-700' },
  { id: 's11', name: 'Programming', slug: 'programming', icon: 'Terminal', tutorCount: 740, category: 'Technology', gradient: 'from-indigo-500 to-violet-600' },
  { id: 's12', name: 'Test Prep (SAT/IELTS)', slug: 'test-prep', icon: 'GraduationCap', tutorCount: 430, category: 'Exam Prep', gradient: 'from-fuchsia-500 to-pink-600' },
];

export const SUBJECT_CATEGORIES = [
  'Sciences',
  'Languages',
  'Technology',
  'Commerce',
  'Humanities',
  'Exam Prep',
];
