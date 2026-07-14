/* ============================================================================
   Dummy data for the Admin portal. Frontend-only for now — swap for real API
   calls later. Names/cities are Pakistan-flavoured to match the product.
   ========================================================================== */

export type AccountStatus = 'active' | 'pending' | 'suspended';
export type VerifyStatus = 'verified' | 'partial' | 'under_review' | 'rejected' | 'not_started';

export interface AdminKpi {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  icon: string;
  accent: 'brand' | 'emerald' | 'amber' | 'violet';
}

export const ADMIN_KPIS: AdminKpi[] = [
  { label: 'Verified tutors', value: '1,284', delta: '+8.2%', trend: 'up', icon: 'GraduationCap', accent: 'brand' },
  { label: 'Registered students', value: '18,940', delta: '+12.4%', trend: 'up', icon: 'Users', accent: 'violet' },
  { label: 'Institutes', value: '312', delta: '+5.1%', trend: 'up', icon: 'Building2', accent: 'emerald' },
  { label: 'Pending approvals', value: '47', delta: '+9', trend: 'up', icon: 'ShieldAlert', accent: 'amber' },
];

export const SECONDARY_KPIS: AdminKpi[] = [
  { label: 'Sessions this month', value: '6,420', delta: '+15%', trend: 'up', icon: 'CalendarCheck', accent: 'brand' },
  { label: 'Monthly revenue', value: 'PKR 1.76M', delta: '+18%', trend: 'up', icon: 'Wallet', accent: 'emerald' },
  { label: 'Avg. tutor rating', value: '4.8', delta: '+0.1', trend: 'up', icon: 'Star', accent: 'amber' },
  { label: 'Dispute rate', value: '1.3%', delta: '-0.4%', trend: 'down', icon: 'AlertTriangle', accent: 'violet' },
];

export const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

/** New registrations per month (last 12 months). */
export const REGISTRATIONS = {
  tutors: [42, 55, 61, 70, 84, 96, 88, 110, 132, 150, 168, 190],
  students: [320, 410, 480, 560, 640, 720, 690, 850, 980, 1120, 1260, 1420],
};

/** Monthly platform revenue in PKR (thousands). */
export const REVENUE_SERIES = [620, 710, 690, 780, 910, 1020, 980, 1180, 1340, 1510, 1620, 1760];

/** Split of the user base. */
export const ROLE_BREAKDOWN = [
  { label: 'Students', value: 18940, color: '#8b5cf6' },
  { label: 'Tutors', value: 1284, color: '#2563eb' },
  { label: 'Parents', value: 5210, color: '#f59e0b' },
  { label: 'Institutes', value: 312, color: '#10b981' },
];

/** Revenue by stream (PKR, monthly). */
export const REVENUE_BY_STREAM = [
  { label: 'Session commissions', value: 402000, color: '#2563eb' },
  { label: 'Parent subscriptions', value: 499500, color: '#8b5cf6' },
  { label: 'Institute plans', value: 499900, color: '#10b981' },
  { label: 'Premium listings', value: 149700, color: '#f59e0b' },
  { label: 'Verification fees', value: 150000, color: '#f43f5e' },
];

export const TOP_SUBJECTS = [
  { name: 'Mathematics', tutors: 480 },
  { name: 'Physics', tutors: 356 },
  { name: 'English', tutors: 342 },
  { name: 'Chemistry', tutors: 298 },
  { name: 'Computer Science', tutors: 264 },
  { name: 'Biology', tutors: 231 },
];

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Accounting'];

function avatar(i: number) {
  return `https://i.pravatar.cc/96?img=${(i % 70) + 1}`;
}

export interface AdminTutor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  city: string;
  subjects: string[];
  rating: number;
  sessions: number;
  status: AccountStatus;
  verification: VerifyStatus;
  joined: string;
}

const TUTOR_NAMES = [
  'Ayesha Khan', 'Bilal Ahmed', 'Fatima Noor', 'Usman Tariq', 'Hina Raza', 'Ali Hassan',
  'Sana Malik', 'Zain Abbas', 'Maryam Tariq', 'Ahmed Shah', 'Rabia Aslam', 'Hamza Sheikh',
  'Nida Iqbal', 'Kashif Javed', 'Sadia Yousuf', 'Omar Farooq',
];

export const ADMIN_TUTORS: AdminTutor[] = TUTOR_NAMES.map((name, i) => {
  const verifications: VerifyStatus[] = ['verified', 'verified', 'verified', 'under_review', 'partial', 'rejected', 'not_started'];
  const statuses: AccountStatus[] = ['active', 'active', 'active', 'pending', 'active', 'suspended'];
  return {
    id: `t_${1000 + i}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    avatar: avatar(i),
    city: CITIES[i % CITIES.length],
    subjects: [SUBJECTS[i % SUBJECTS.length], SUBJECTS[(i + 2) % SUBJECTS.length]],
    rating: Number((4.2 + (i % 8) * 0.1).toFixed(1)),
    sessions: 20 + ((i * 37) % 480),
    status: statuses[i % statuses.length],
    verification: verifications[i % verifications.length],
    joined: `2026-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
  };
});

export type StepStatus = 'passed' | 'under_review' | 'not_started' | 'rejected';

export interface ApprovalItem {
  id: string;
  tutorId: string;
  name: string;
  avatar: string;
  city: string;
  subjects: string[];
  submittedAt: string;
  steps: { key: string; label: string; status: StepStatus }[];
}

const STEP_LABELS = [
  ['IDENTITY', 'Identity'],
  ['EDUCATION', 'Education'],
  ['BACKGROUND', 'Background'],
  ['EXPERIENCE', 'Experience'],
  ['PROFICIENCY', 'Proficiency'],
  ['DEMO', 'Demo'],
  ['ADMIN_APPROVAL', 'Final'],
];

export const APPROVAL_QUEUE: ApprovalItem[] = ADMIN_TUTORS.filter(
  (t) => t.verification === 'under_review' || t.verification === 'partial',
).map((t, i) => ({
  id: `a_${i}`,
  tutorId: t.id,
  name: t.name,
  avatar: t.avatar,
  city: t.city,
  subjects: t.subjects,
  submittedAt: `${3 + i} days ago`,
  steps: STEP_LABELS.map(([key, label], si) => ({
    key,
    label,
    status: (si < 4 ? 'passed' : si === 4 ? 'under_review' : si === 6 ? 'not_started' : 'under_review') as StepStatus,
  })),
}));

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  city: string;
  bookings: number;
  spent: number;
  plan: 'Free' | 'Premium';
  status: AccountStatus;
  joined: string;
}

const STUDENT_NAMES = [
  'Hassan Ali', 'Zoya Khan', 'Ibrahim Malik', 'Areeba Fatima', 'Daniyal Ahmed', 'Mahnoor Shah',
  'Saad Qureshi', 'Eman Riaz', 'Talha Nadeem', 'Iqra Hussain', 'Rehan Baig', 'Aiman Siddiqui',
];

export const ADMIN_STUDENTS: AdminStudent[] = STUDENT_NAMES.map((name, i) => ({
  id: `s_${2000 + i}`,
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  avatar: avatar(i + 20),
  city: CITIES[i % CITIES.length],
  bookings: (i * 7) % 40,
  spent: 2000 + ((i * 3100) % 60000),
  plan: i % 3 === 0 ? 'Premium' : 'Free',
  status: i % 5 === 4 ? 'suspended' : 'active',
  joined: `2026-0${(i % 6) + 1}-1${i % 9}`,
}));

export interface AdminInstitute {
  id: string;
  name: string;
  city: string;
  teachersHired: number;
  jobsPosted: number;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  status: AccountStatus;
  joined: string;
}

const INSTITUTE_NAMES = [
  'Beaconhouse School', 'The City School', 'Roots Millennium', 'LGS Defence', 'Bahria Foundation',
  'Army Public School', 'Punjab College', 'Allied Academy', 'Scholars Academy', 'Bright Future Institute',
];

export const ADMIN_INSTITUTES: AdminInstitute[] = INSTITUTE_NAMES.map((name, i) => ({
  id: `i_${3000 + i}`,
  name,
  city: CITIES[i % CITIES.length],
  teachersHired: (i * 5) % 40,
  jobsPosted: (i * 3) % 25,
  plan: (['Basic', 'Pro', 'Enterprise'] as const)[i % 3],
  status: i % 6 === 5 ? 'pending' : 'active',
  joined: `2026-0${(i % 6) + 1}-2${i % 8}`,
}));

export interface AdminBooking {
  id: string;
  student: string;
  tutor: string;
  subject: string;
  date: string;
  mode: 'online' | 'home_visit' | 'institute';
  amount: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'disputed';
}

export const ADMIN_BOOKINGS: AdminBooking[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `b_${4000 + i}`,
  student: STUDENT_NAMES[i % STUDENT_NAMES.length],
  tutor: TUTOR_NAMES[i % TUTOR_NAMES.length],
  subject: SUBJECTS[i % SUBJECTS.length],
  date: `2026-06-${String((i % 28) + 1).padStart(2, '0')}`,
  mode: (['online', 'home_visit', 'institute'] as const)[i % 3],
  amount: 1500 + ((i * 500) % 4000),
  status: (['completed', 'upcoming', 'completed', 'cancelled', 'disputed'] as const)[i % 5],
}));

export interface AdminPayment {
  id: string;
  party: string;
  type: 'Session' | 'Subscription' | 'Payout' | 'Verification fee' | 'Institute plan';
  method: 'JazzCash' | 'Easypaisa' | 'Card';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'refunded';
}

export const ADMIN_PAYMENTS: AdminPayment[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `p_${5000 + i}`,
  party: i % 2 === 0 ? STUDENT_NAMES[i % STUDENT_NAMES.length] : TUTOR_NAMES[i % TUTOR_NAMES.length],
  type: (['Session', 'Subscription', 'Payout', 'Verification fee', 'Institute plan'] as const)[i % 5],
  method: (['JazzCash', 'Easypaisa', 'Card'] as const)[i % 3],
  amount: 500 + ((i * 1300) % 9000),
  date: `2026-06-${String((i % 28) + 1).padStart(2, '0')}`,
  status: (['completed', 'completed', 'pending', 'refunded'] as const)[i % 4],
}));

export interface Activity {
  icon: string;
  accent: 'brand' | 'emerald' | 'amber' | 'violet' | 'rose';
  text: string;
  time: string;
}

export const RECENT_ACTIVITY: Activity[] = [
  { icon: 'GraduationCap', accent: 'brand', text: 'Ayesha Khan submitted verification documents', time: '5m ago' },
  { icon: 'ShieldCheck', accent: 'emerald', text: 'You approved Bilal Ahmed as a verified tutor', time: '22m ago' },
  { icon: 'Building2', accent: 'violet', text: 'Beaconhouse School upgraded to Enterprise plan', time: '1h ago' },
  { icon: 'AlertTriangle', accent: 'rose', text: 'A dispute was opened on booking #4021', time: '2h ago' },
  { icon: 'Wallet', accent: 'amber', text: 'PKR 42,000 payout released to Usman Tariq', time: '3h ago' },
  { icon: 'Users', accent: 'brand', text: '128 new students registered today', time: '5h ago' },
];
