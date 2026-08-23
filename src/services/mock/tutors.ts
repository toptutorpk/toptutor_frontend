import type {
  AvailabilitySlot,
  City,
  Review,
  SessionPackage,
  TeachingLanguage,
  Tutor,
  VerificationStatus,
  VerificationStep,
} from '@/types';
import { VERIFICATION_STEPS } from '@/constants';

// Step ids, so the shapes below survive the list being reordered: 3 is the criminal background
// check (what a rejection turns on), 4 the optional experience proof, and 5+ the video and final
// approval — the tail a part-reviewed application is still waiting on.
const STEP_BACKGROUND = 3;
const STEP_EXPERIENCE = 4;
const STEP_AWAITING_REVIEW_FROM = 5;

function buildSteps(status: VerificationStatus): VerificationStep[] {
  return VERIFICATION_STEPS.map((s) => {
    let stepStatus: VerificationStep['status'] = 'passed';
    if (status === 'rejected' && s.id === STEP_BACKGROUND) stepStatus = 'failed';
    else if (status === 'under_review' && s.id >= STEP_AWAITING_REVIEW_FROM) stepStatus = 'pending';
    else if (status === 'partial' && s.id === STEP_EXPERIENCE) stepStatus = 'optional';
    return { ...s, status: stepStatus };
  });
}

function buildAvailability(seed: number): AvailabilitySlot[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'];
  const base = new Date();
  return days.map((day, i) => {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    return {
      day,
      date: date.toISOString(),
      slots: times.map((time, j) => ({
        time,
        available: (seed + i + j) % 3 !== 0,
      })),
    };
  });
}

function buildPackages(rate: number): SessionPackage[] {
  return [
    {
      id: 'pkg-single',
      title: 'Single Session',
      sessions: 1,
      pricePerSession: rate,
      totalPrice: rate,
      perks: ['1 hour live session', 'Homework help', 'Session notes'],
    },
    {
      id: 'pkg-weekly',
      title: 'Weekly Pack',
      sessions: 8,
      pricePerSession: Math.round(rate * 0.9),
      totalPrice: Math.round(rate * 0.9) * 8,
      popular: true,
      perks: ['8 sessions / month', '10% savings', 'Progress report', 'Priority scheduling'],
    },
    {
      id: 'pkg-intensive',
      title: 'Exam Intensive',
      sessions: 16,
      pricePerSession: Math.round(rate * 0.82),
      totalPrice: Math.round(rate * 0.82) * 16,
      perks: ['16 sessions', '18% savings', 'Mock tests', 'Dedicated WhatsApp support'],
    },
  ];
}

const REVIEW_SNIPPETS = [
  'Explains tough concepts so simply — my daughter went from a C to an A in two months.',
  'Always punctual, patient and very professional. Highly recommend for O-Levels.',
  'The verified badge gave us peace of mind. Excellent teacher and very polite.',
  'Great with kids. My son actually looks forward to maths now!',
  'Structured lessons with clear homework. Saw improvement within weeks.',
  'Very knowledgeable and answers every doubt without rushing.',
];

function buildReviews(tutorId: string, count: number, rating: number): Review[] {
  const names = ['Ayesha K.', 'Bilal R.', 'Sana M.', 'Fahad A.', 'Hira S.', 'Usman T.'];
  return Array.from({ length: Math.min(count, 6) }).map((_, i) => ({
    id: `${tutorId}-rev-${i}`,
    tutorId,
    authorName: names[i % names.length],
    authorAvatar: `https://i.pravatar.cc/96?img=${(i + 10) % 70}`,
    rating: Math.max(3, Math.round(rating + (i % 2 === 0 ? 0 : -0.4))),
    comment: REVIEW_SNIPPETS[i % REVIEW_SNIPPETS.length],
    date: new Date(Date.now() - i * 86400000 * 9).toISOString(),
    subject: i % 2 === 0 ? 'Mathematics' : 'Physics',
    tutorResponse:
      i === 0 ? 'Thank you so much! It was a pleasure teaching your child. 🙏' : undefined,
    helpfulCount: 12 - i,
  }));
}

interface Seed {
  name: string;
  headline: string;
  subjects: string[];
  city: City;
  area: string;
  gender: 'male' | 'female';
  rate: number;
  rating: number;
  reviews: number;
  status: VerificationStatus;
  exp: number;
  lang: TeachingLanguage;
  img: number;
  premium?: boolean;
}

const SEEDS: Seed[] = [
  { name: 'Ayesha Khan', headline: 'O/A-Level Mathematics & Physics Specialist', subjects: ['Mathematics', 'Physics'], city: 'Karachi', area: 'DHA Phase 5', gender: 'female', rate: 2500, rating: 4.9, reviews: 214, status: 'verified', exp: 8, lang: 'Both', img: 5, premium: true },
  { name: 'Bilal Ahmed', headline: 'Computer Science & Programming Mentor', subjects: ['Computer Science', 'Programming'], city: 'Lahore', area: 'Gulberg III', gender: 'male', rate: 3000, rating: 4.8, reviews: 156, status: 'verified', exp: 6, lang: 'English', img: 12, premium: true },
  { name: 'Fatima Noor', headline: 'Biology & Chemistry for MDCAT/Matric', subjects: ['Biology', 'Chemistry'], city: 'Islamabad', area: 'F-7', gender: 'female', rate: 2200, rating: 4.9, reviews: 189, status: 'verified', exp: 7, lang: 'Both', img: 20 },
  { name: 'Hamza Sheikh', headline: 'Accounting & Economics (ACCA, A-Levels)', subjects: ['Accounting', 'Economics'], city: 'Karachi', area: 'Clifton', gender: 'male', rate: 2800, rating: 4.7, reviews: 98, status: 'verified', exp: 5, lang: 'English', img: 33 },
  { name: 'Maryam Tariq', headline: 'English Language & IELTS Coach', subjects: ['English', 'Test Prep (SAT/IELTS)'], city: 'Lahore', area: 'Model Town', gender: 'female', rate: 2400, rating: 4.8, reviews: 142, status: 'verified', exp: 9, lang: 'English', img: 25, premium: true },
  { name: 'Usman Raza', headline: 'Physics & Mathematics — Engineering Prep', subjects: ['Physics', 'Mathematics'], city: 'Rawalpindi', area: 'Bahria Town', gender: 'male', rate: 2000, rating: 4.6, reviews: 76, status: 'partial', exp: 4, lang: 'Both', img: 51 },
  { name: 'Zainab Ali', headline: 'Primary & Middle School All Subjects', subjects: ['Mathematics', 'English', 'Urdu'], city: 'Faisalabad', area: 'Madina Town', gender: 'female', rate: 1500, rating: 4.7, reviews: 64, status: 'verified', exp: 6, lang: 'Urdu', img: 45 },
  { name: 'Ali Hassan', headline: 'Chemistry Specialist — Concept Based', subjects: ['Chemistry'], city: 'Multan', area: 'Cantt', gender: 'male', rate: 1800, rating: 4.5, reviews: 41, status: 'under_review', exp: 3, lang: 'Both', img: 60 },
  { name: 'Sana Iqbal', headline: 'Computer Science & Web Development', subjects: ['Computer Science', 'Programming'], city: 'Islamabad', area: 'G-11', gender: 'female', rate: 3200, rating: 4.9, reviews: 121, status: 'verified', exp: 7, lang: 'English', img: 9, premium: true },
  { name: 'Imran Malik', headline: 'Islamic Studies & Urdu Literature', subjects: ['Islamic Studies', 'Urdu'], city: 'Lahore', area: 'Johar Town', gender: 'male', rate: 1600, rating: 4.8, reviews: 87, status: 'verified', exp: 10, lang: 'Urdu', img: 68 },
  { name: 'Hira Yousaf', headline: 'Economics & Business Studies (A-Level)', subjects: ['Economics', 'Accounting'], city: 'Karachi', area: 'Gulshan-e-Iqbal', gender: 'female', rate: 2600, rating: 4.7, reviews: 73, status: 'verified', exp: 5, lang: 'English', img: 31 },
  { name: 'Tariq Mehmood', headline: 'Mathematics — Matric to BSc', subjects: ['Mathematics'], city: 'Peshawar', area: 'University Town', gender: 'male', rate: 1700, rating: 4.4, reviews: 38, status: 'partial', exp: 4, lang: 'Both', img: 14 },
];

export const TUTORS: Tutor[] = SEEDS.map((s, i) => {
  const slug = s.name.toLowerCase().replace(/\s+/g, '-');
  return {
    id: `t${i + 1}`,
    slug,
    name: s.name,
    headline: s.headline,
    avatarUrl: `https://i.pravatar.cc/300?img=${s.img}`,
    coverUrl: `https://picsum.photos/seed/${slug}/1200/360`,
    videoIntroUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    verificationStatus: s.status,
    verificationSteps: buildSteps(s.status),
    rating: s.rating,
    reviewCount: s.reviews,
    subjects: s.subjects,
    gradeLevels: ['Matric (9-10)', 'O-Levels', 'Intermediate (11-12)', 'A-Levels'],
    languages: s.lang,
    modes: i % 3 === 0 ? ['online', 'home_visit'] : i % 3 === 1 ? ['online'] : ['online', 'home_visit', 'institute'],
    city: s.city,
    area: s.area,
    gender: s.gender,
    hourlyRate: s.rate,
    monthlyRate: s.rate * 8,
    currency: 'PKR',
    bio: `Assalam-o-Alaikum! I'm ${s.name.split(' ')[0]}, a passionate educator with ${s.exp}+ years of experience helping students master ${s.subjects.join(' & ')}. My teaching philosophy centres on building strong fundamentals through concept-based learning, regular assessments and a supportive environment. Every student learns differently, so I tailor each session to your child's pace and goals. I've helped over ${s.reviews * 3} students improve their grades and confidence.`,
    experienceYears: s.exp,
    responseRate: 92 + (i % 8),
    repeatHireRate: 70 + (i % 25),
    totalSessions: s.reviews * 7,
    education: [
      { degree: 'MSc / MPhil', institution: i % 2 ? 'Punjab University' : 'NED University', year: `${2014 + (i % 6)}`, verified: s.status === 'verified' },
      { degree: 'BSc (Hons)', institution: i % 2 ? 'LUMS' : 'University of Karachi', year: `${2011 + (i % 4)}`, verified: true },
    ],
    certifications: [
      { name: 'Certified Subject Examiner', issuer: 'Cambridge Assessment', year: '2022', verified: s.status === 'verified' },
      { name: 'Child Safeguarding Training', issuer: 'TopTutor Academy', year: '2025', verified: true },
    ],
    skills: ['Concept Building', 'Exam Technique', 'Past Papers', 'Time Management', 'Homework Support'],
    packages: buildPackages(s.rate),
    availability: buildAvailability(i),
    reviews: buildReviews(`t${i + 1}`, s.reviews, s.rating),
    isPremium: s.premium,
    isFavorite: i % 4 === 0,
    isOnline: i % 3 !== 1, // ~two-thirds shown as currently active
  };
});

export function findTutorBySlug(slug: string): Tutor | undefined {
  return TUTORS.find((t) => t.slug === slug || t.id === slug);
}
