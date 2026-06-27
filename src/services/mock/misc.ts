import type { Booking, Conversation, Message, Notification, Stat } from '@/types';

export const PLATFORM_STATS: Stat[] = [
  { label: 'Verified Tutors', value: '5,000+', icon: 'ShieldCheck', trend: '+12% MoM' },
  { label: 'Happy Parents', value: '25,000+', icon: 'Users', trend: '+18% MoM' },
  { label: 'Sessions Booked', value: '180k+', icon: 'CalendarCheck', trend: '+15% MoM' },
  { label: 'Average Rating', value: '4.8 / 5', icon: 'Star', trend: 'across 40k reviews' },
];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  city: string;
  avatar: string;
  rating: number;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  { id: 'q1', name: 'Nadia Hussain', role: 'Parent of two', city: 'Karachi', avatar: 'https://i.pravatar.cc/96?img=44', rating: 5, quote: 'For the first time I could actually verify a tutor before letting them into my home. The background check gave me total peace of mind, and my son improved dramatically.' },
  { id: 'q2', name: 'Dr. Asad Mahmood', role: 'Principal, Bright Future School', city: 'Lahore', avatar: 'https://i.pravatar.cc/96?img=13', rating: 5, quote: 'We hired three verified teachers in under a week. The credential documents were already checked — it saved our HR team weeks of work.' },
  { id: 'q3', name: 'Saima Rauf', role: 'Working mother', city: 'Islamabad', avatar: 'https://i.pravatar.cc/96?img=47', rating: 5, quote: 'The free 15-minute intro call let us find the perfect match. Payment held in escrow means I only pay when the session actually happens.' },
  { id: 'q4', name: 'Hassan Javed', role: 'A-Level student', city: 'Rawalpindi', avatar: 'https://i.pravatar.cc/96?img=15', rating: 5, quote: 'My tutor is genuinely brilliant. Booking, reminders and payments all happen in the app — zero hassle.' },
];

export const SUCCESS_STORIES = [
  { id: 'ss1', metric: '+2 Grades', label: 'Average improvement', detail: 'Students see a 2-grade jump within one term of consistent sessions.' },
  { id: 'ss2', metric: '48 hours', label: 'Guaranteed payout', detail: 'Tutors receive secure payment within 48 hours of session confirmation.' },
  { id: 'ss3', metric: '100%', label: 'Verified tutors', detail: 'Every listed tutor passes our strict 7-step verification process.' },
];

export const FAQS = [
  { q: 'How does the 7-step verification work?', a: 'Every tutor must pass identity (CNIC/NADRA), education credential, criminal background, teaching experience, subject proficiency, a video demo, and a final admin review before receiving the Verified Badge.' },
  { q: 'Is my payment safe?', a: 'Yes. We use an escrow model — your payment is held securely and only released to the tutor 48 hours after you confirm the session was completed. You have a 24-hour window to raise any dispute.' },
  { q: 'What payment methods are supported?', a: 'JazzCash, Easypaisa, and all major credit/debit cards. Full refunds are available for sessions cancelled 2+ hours before the start time.' },
  { q: 'Can I try a tutor before committing?', a: 'Absolutely. Book a free 15-minute intro call or a discounted trial session with any tutor before booking a full package.' },
  { q: 'Do you stay private until I book?', a: 'Yes. All messaging is in-app and encrypted. The tutor only sees your phone number once a booking is confirmed.' },
  { q: 'How do tutors get paid?', a: 'Tutors keep 80–90% of every session fee (commission decreases as they complete more sessions) with automatic payout within 48 hours.' },
];

export const PRICING_TIERS = [
  {
    id: 'parent-free',
    name: 'Parent — Free',
    price: 0,
    period: 'forever',
    audience: 'parents',
    description: 'Everything you need to find a verified tutor.',
    features: ['Browse all verified tutor profiles', '1 tutor requirement / month', 'In-app encrypted messaging', 'Secure escrow payments', 'Reviews & ratings'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'parent-premium',
    name: 'Parent — Premium',
    price: 999,
    period: 'month',
    audience: 'parents',
    description: 'Priority matching & top-rated tutors first.',
    features: ['Everything in Free', 'Unlimited tutor requirements', 'Priority AI matching', 'Access top-rated tutors first', '5% session discount', 'Dedicated customer support'],
    cta: 'Go Premium',
    highlighted: true,
  },
  {
    id: 'institute',
    name: 'Institute',
    price: 4999,
    period: 'month',
    audience: 'institutes',
    description: 'Hire verified teachers at scale.',
    features: ['Verified teacher database access', 'Unlimited job postings', 'Bulk shortlisting & invites', 'Digital contracts & e-signature', 'Monthly retainer tools', 'Dedicated account manager'],
    cta: 'Start Hiring',
    highlighted: false,
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', tutorId: 't1', tutorName: 'Ayesha Khan', tutorAvatar: 'https://i.pravatar.cc/96?img=5', subject: 'Mathematics', mode: 'online', date: new Date(Date.now() + 86400000).toISOString(), time: '16:00', durationMins: 60, status: 'upcoming', amount: 2500 },
  { id: 'b2', tutorId: 't3', tutorName: 'Fatima Noor', tutorAvatar: 'https://i.pravatar.cc/96?img=20', subject: 'Biology', mode: 'home_visit', date: new Date(Date.now() + 3 * 86400000).toISOString(), time: '18:00', durationMins: 90, status: 'upcoming', amount: 3300 },
  { id: 'b3', tutorId: 't2', tutorName: 'Bilal Ahmed', tutorAvatar: 'https://i.pravatar.cc/96?img=12', subject: 'Computer Science', mode: 'online', date: new Date(Date.now() - 2 * 86400000).toISOString(), time: '20:00', durationMins: 60, status: 'completed', amount: 3000 },
  { id: 'b4', tutorId: 't5', tutorName: 'Maryam Tariq', tutorAvatar: 'https://i.pravatar.cc/96?img=25', subject: 'English (IELTS)', mode: 'online', date: new Date(Date.now() - 5 * 86400000).toISOString(), time: '14:00', durationMins: 60, status: 'completed', amount: 2400, isTrial: true },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'c1', participantName: 'Ayesha Khan', participantAvatar: 'https://i.pravatar.cc/96?img=5', lastMessage: 'Sure, we can start at 4pm tomorrow.', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), unread: 2, online: true },
  { id: 'c2', participantName: 'Bilal Ahmed', participantAvatar: 'https://i.pravatar.cc/96?img=12', lastMessage: 'I have shared the practice sheet.', lastMessageAt: new Date(Date.now() - 7200000).toISOString(), unread: 0, online: false },
  { id: 'c3', participantName: 'Fatima Noor', participantAvatar: 'https://i.pravatar.cc/96?img=20', lastMessage: 'Great progress this week! 🎉', lastMessageAt: new Date(Date.now() - 86400000).toISOString(), unread: 0, online: true },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', conversationId: 'c1', senderId: 't1', text: 'Assalam-o-Alaikum! Thanks for reaching out.', at: new Date(Date.now() - 7200000).toISOString(), mine: false },
  { id: 'm2', conversationId: 'c1', senderId: 'me', text: 'Walaikum Assalam! Are you available for O-Level maths?', at: new Date(Date.now() - 7000000).toISOString(), mine: true },
  { id: 'm3', conversationId: 'c1', senderId: 't1', text: 'Yes! I have slots on weekday evenings.', at: new Date(Date.now() - 6800000).toISOString(), mine: false },
  { id: 'm4', conversationId: 'c1', senderId: 'me', text: 'Perfect, can we do a trial this week?', at: new Date(Date.now() - 3700000).toISOString(), mine: true },
  { id: 'm5', conversationId: 'c1', senderId: 't1', text: 'Sure, we can start at 4pm tomorrow.', at: new Date(Date.now() - 3600000).toISOString(), mine: false },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Booking confirmed', body: 'Your session with Ayesha Khan is confirmed for tomorrow 4:00 PM.', type: 'booking', read: false, at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'n2', title: 'Payment held in escrow', body: 'PKR 2,500 is securely held and will be released after your session.', type: 'payment', read: false, at: new Date(Date.now() - 5400000).toISOString() },
  { id: 'n3', title: 'New message', body: 'Bilal Ahmed sent you a message.', type: 'system', read: true, at: new Date(Date.now() - 9000000).toISOString() },
  { id: 'n4', title: 'Leave a review', body: 'How was your session with Maryam Tariq? Share your feedback.', type: 'review', read: true, at: new Date(Date.now() - 2 * 86400000).toISOString() },
];
