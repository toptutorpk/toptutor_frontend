import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminRoute } from '@/routes/AdminRoute';
import { DashboardHomeRedirect, DashboardSectionRoute } from '@/routes/DashboardSectionRoute';
import { PageLoader } from '@/components/common/PageLoader';

// ---- Lazy pages (code splitting) -------------------------------------------
const HomePage = lazy(() => import('@/pages/HomePage'));
const TutorListingPage = lazy(() => import('@/pages/TutorListingPage'));
const TutorProfilePage = lazy(() => import('@/pages/TutorProfilePage'));
const SubjectsPage = lazy(() => import('@/pages/SubjectsPage'));
const SubjectRedirectPage = lazy(() => import('@/pages/SubjectRedirectPage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const InstitutesPage = lazy(() => import('@/pages/InstitutesPage'));
const PublicInstitutePage = lazy(() => import('@/pages/InstituteProfilePage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const ReportMisconductPage = lazy(() => import('@/pages/ReportMisconductPage'));
const SimplePage = lazy(() => import('@/pages/SimplePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Legal — split out so the long documents never load with the marketing pages.
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/legal/TermsOfServicePage'));

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupChoicePage = lazy(() => import('@/pages/auth/SignupChoicePage'));
const StudentSignupPage = lazy(() => import('@/pages/auth/StudentSignupPage'));
const InstituteSignupPage = lazy(() => import('@/pages/auth/InstituteSignupPage'));
const InstituteOverview = lazy(() => import('@/pages/dashboard/institute/Overview'));
const InstituteTeachers = lazy(() => import('@/pages/dashboard/institute/Teachers'));
const InstituteJobs = lazy(() => import('@/pages/dashboard/institute/Jobs'));
const InstituteHiringPage = lazy(() => import('@/pages/dashboard/institute/Hiring'));
const InstituteBilling = lazy(() => import('@/pages/dashboard/institute/Billing'));
const InstitutePayroll = lazy(() => import('@/pages/dashboard/institute/Payroll'));
const InstituteRegistration = lazy(() => import('@/pages/dashboard/institute/Registration'));
const InstituteProfilePage = lazy(() => import('@/pages/dashboard/institute/Profile'));
const TutorSignupPage = lazy(() => import('@/pages/auth/TutorSignupPage'));
const TutorProfileCreatePage = lazy(() => import('@/pages/auth/TutorProfileCreatePage'));
const BookingCallback = lazy(() => import('@/pages/BookingCallback'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const OtpVerificationPage = lazy(() => import('@/pages/auth/OtpVerificationPage'));
const EmailVerificationPage = lazy(() => import('@/pages/auth/EmailVerificationPage'));
const WelcomePage = lazy(() => import('@/pages/auth/WelcomePage'));

// Student dashboard
const StudentOverview = lazy(() => import('@/pages/dashboard/student/Overview'));
const StudentBookings = lazy(() => import('@/pages/dashboard/student/Bookings'));
const MessagesPage = lazy(() => import('@/pages/dashboard/Messages'));
const StudentFavorites = lazy(() => import('@/pages/dashboard/student/Favorites'));
const StudentPayments = lazy(() => import('@/pages/dashboard/student/Payments'));
const StudentReviews = lazy(() => import('@/pages/dashboard/student/Reviews'));
const NotificationsPage = lazy(() => import('@/pages/dashboard/Notifications'));
const ProfileSettings = lazy(() => import('@/pages/dashboard/ProfileSettings'));
const AccountSettings = lazy(() => import('@/pages/dashboard/Settings'));

// Tutor dashboard
const TutorAnalytics = lazy(() => import('@/pages/dashboard/tutor/Analytics'));
const TutorEarnings = lazy(() => import('@/pages/dashboard/tutor/Earnings'));
const TutorSchedule = lazy(() => import('@/pages/dashboard/tutor/Schedule'));
const TutorSessions = lazy(() => import('@/pages/dashboard/tutor/Sessions'));
const TutorReviews = lazy(() => import('@/pages/dashboard/tutor/Reviews'));
const TutorVerification = lazy(() => import('@/pages/dashboard/tutor/Verification'));
const TutorInstituteHiring = lazy(() => import('@/pages/dashboard/tutor/InstituteHiring'));
const TutorJobs = lazy(() => import('@/pages/dashboard/tutor/Jobs'));
const TutorOffers = lazy(() => import('@/pages/dashboard/tutor/Offers'));
const TutorMedia = lazy(() => import('@/pages/dashboard/tutor/Media'));
const TutorPlaceholder = lazy(() => import('@/pages/dashboard/tutor/TutorPlaceholder'));

// Admin portal
const AdminOverview = lazy(() => import('@/pages/admin/Overview'));
const AdminApprovals = lazy(() => import('@/pages/admin/Approvals'));
const AdminAlerts = lazy(() => import('@/pages/admin/Alerts'));
const AdminReports = lazy(() => import('@/pages/admin/Reports'));
const AdminTutorReview = lazy(() => import('@/pages/admin/TutorReview'));
const AdminTutors = lazy(() => import('@/pages/admin/Tutors'));
const AdminStudents = lazy(() => import('@/pages/admin/Students'));
const AdminInstitutes = lazy(() => import('@/pages/admin/Institutes'));
const AdminInstituteReview = lazy(() => import('@/pages/admin/InstituteReview'));
const AdminBookings = lazy(() => import('@/pages/admin/Bookings'));
const AdminPayments = lazy(() => import('@/pages/admin/Payments'));
const AdminPayoutAccounts = lazy(() => import('@/pages/admin/PayoutAccounts'));
const AdminRefunds = lazy(() => import('@/pages/admin/Refunds'));
const AdminInstituteBilling = lazy(() => import('@/pages/admin/InstituteBilling'));
const AdminAnalytics = lazy(() => import('@/pages/admin/Analytics'));
const AdminSettings = lazy(() => import('@/pages/admin/Settings'));

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const routes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: (
          <S>
            <HomePage />
          </S>
        ),
      },
      {
        path: '/tutors',
        element: (
          <S>
            <TutorListingPage />
          </S>
        ),
      },
      {
        path: '/tutors/:slug',
        element: (
          <S>
            <TutorProfilePage />
          </S>
        ),
      },
      {
        path: '/subjects',
        element: (
          <S>
            <SubjectsPage />
          </S>
        ),
      },
      {
        path: '/subjects/:slug',
        element: (
          <S>
            <SubjectRedirectPage />
          </S>
        ),
      },
      {
        path: '/how-it-works',
        element: (
          <S>
            <HowItWorksPage />
          </S>
        ),
      },
      {
        path: '/pricing',
        element: (
          <S>
            <PricingPage />
          </S>
        ),
      },
      {
        path: '/institutes',
        element: (
          <S>
            <InstitutesPage />
          </S>
        ),
      },
      {
        path: '/institutes/:slug',
        element: (
          <S>
            <PublicInstitutePage />
          </S>
        ),
      },
      {
        path: '/about',
        element: (
          <S>
            <SimplePage title="About TopTutor" />
          </S>
        ),
      },
      {
        path: '/blog',
        element: (
          <S>
            <SimplePage title="Blog" />
          </S>
        ),
      },
      {
        path: '/careers',
        element: (
          <S>
            <SimplePage title="Careers" />
          </S>
        ),
      },
      {
        path: '/contact',
        element: (
          <S>
            <ContactPage />
          </S>
        ),
      },
      {
        path: '/child-safety',
        element: (
          <S>
            <SimplePage title="Child Safety" />
          </S>
        ),
      },
      {
        path: '/privacy',
        element: (
          <S>
            <PrivacyPolicyPage />
          </S>
        ),
      },
      {
        path: '/terms',
        element: (
          <S>
            <TermsOfServicePage />
          </S>
        ),
      },
      {
        path: '/report',
        element: (
          <S>
            <ReportMisconductPage />
          </S>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <S>
            <LoginPage />
          </S>
        ),
      },
      {
        path: '/signup',
        element: (
          <S>
            <SignupChoicePage />
          </S>
        ),
      },
      {
        path: '/signup/student',
        element: (
          <S>
            <StudentSignupPage />
          </S>
        ),
      },
      {
        path: '/signup/institute',
        element: (
          <S>
            <InstituteSignupPage />
          </S>
        ),
      },
      {
        path: '/signup/tutor',
        element: (
          <S>
            <TutorSignupPage />
          </S>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <S>
            <ForgotPasswordPage />
          </S>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <S>
            <ResetPasswordPage />
          </S>
        ),
      },
      {
        path: '/verify-otp',
        element: (
          <S>
            <OtpVerificationPage />
          </S>
        ),
      },
      {
        path: '/verify-email',
        element: (
          <S>
            <EmailVerificationPage />
          </S>
        ),
      },
      {
        path: '/welcome',
        element: (
          <S>
            <WelcomePage />
          </S>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardHomeRedirect /> },
      {
        element: <DashboardSectionRoute section="/dashboard/student" />,
        children: [
          {
            path: '/dashboard/student',
            element: <DashboardLayout role="student" />,
            children: [
              {
                index: true,
                element: (
                  <S>
                    <StudentOverview />
                  </S>
                ),
              },
              {
                path: 'bookings',
                element: (
                  <S>
                    <StudentBookings />
                  </S>
                ),
              },
              {
                path: 'messages',
                element: (
                  <S>
                    <MessagesPage />
                  </S>
                ),
              },
              {
                path: 'favorites',
                element: (
                  <S>
                    <StudentFavorites />
                  </S>
                ),
              },
              {
                path: 'payments',
                element: (
                  <S>
                    <StudentPayments />
                  </S>
                ),
              },
              {
                path: 'reviews',
                element: (
                  <S>
                    <StudentReviews />
                  </S>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <S>
                    <NotificationsPage />
                  </S>
                ),
              },
              {
                path: 'profile',
                element: (
                  <S>
                    <ProfileSettings />
                  </S>
                ),
              },
              {
                path: 'settings',
                element: (
                  <S>
                    <AccountSettings />
                  </S>
                ),
              },
            ],
          },
        ],
      },
      {
        element: <DashboardSectionRoute section="/dashboard/institute" />,
        children: [
          {
            path: '/dashboard/institute',
            element: <DashboardLayout role="institute" />,
            children: [
              {
                index: true,
                element: (
                  <S>
                    <InstituteOverview />
                  </S>
                ),
              },
              {
                path: 'teachers',
                element: (
                  <S>
                    <InstituteTeachers />
                  </S>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <S>
                    <NotificationsPage />
                  </S>
                ),
              },
              {
                path: 'jobs',
                element: (
                  <S>
                    <InstituteJobs />
                  </S>
                ),
              },
              {
                path: 'hiring',
                element: (
                  <S>
                    <InstituteHiringPage />
                  </S>
                ),
              },
              {
                path: 'payroll',
                element: (
                  <S>
                    <InstitutePayroll />
                  </S>
                ),
              },
              {
                path: 'messages',
                element: (
                  <S>
                    <MessagesPage />
                  </S>
                ),
              },
              {
                path: 'billing',
                element: (
                  <S>
                    <InstituteBilling />
                  </S>
                ),
              },
              {
                path: 'registration',
                element: (
                  <S>
                    <InstituteRegistration />
                  </S>
                ),
              },
              {
                path: 'profile',
                element: (
                  <S>
                    <InstituteProfilePage />
                  </S>
                ),
              },
              {
                path: 'settings',
                element: (
                  <S>
                    <AccountSettings />
                  </S>
                ),
              },
            ],
          },
        ],
      },
      {
        element: <DashboardSectionRoute section="/dashboard/tutor" />,
        children: [
          {
            path: '/dashboard/tutor',
            element: <DashboardLayout role="tutor" />,
            children: [
              {
                index: true,
                element: (
                  <S>
                    <TutorAnalytics />
                  </S>
                ),
              },
              {
                path: 'earnings',
                element: (
                  <S>
                    <TutorEarnings />
                  </S>
                ),
              },
              {
                path: 'schedule',
                element: (
                  <S>
                    <TutorSchedule />
                  </S>
                ),
              },
              {
                path: 'sessions',
                element: (
                  <S>
                    <TutorSessions />
                  </S>
                ),
              },
              {
                path: 'students',
                element: (
                  <S>
                    <TutorPlaceholder title="My Students" />
                  </S>
                ),
              },
              {
                path: 'reviews',
                element: (
                  <S>
                    <TutorReviews />
                  </S>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <S>
                    <NotificationsPage />
                  </S>
                ),
              },
              {
                path: 'messages',
                element: (
                  <S>
                    <MessagesPage />
                  </S>
                ),
              },
              {
                path: 'verification',
                element: (
                  <S>
                    <TutorVerification />
                  </S>
                ),
              },
              {
                path: 'jobs',
                element: (
                  <S>
                    <TutorJobs />
                  </S>
                ),
              },
              {
                path: 'offers',
                element: (
                  <S>
                    <TutorOffers />
                  </S>
                ),
              },
              {
                path: 'institute-hiring',
                element: (
                  <S>
                    <TutorInstituteHiring />
                  </S>
                ),
              },
              {
                path: 'profile',
                element: (
                  <S>
                    <ProfileSettings />
                  </S>
                ),
              },
              {
                path: 'media',
                element: (
                  <S>
                    <TutorMedia />
                  </S>
                ),
              },
              {
                path: 'settings',
                element: (
                  <S>
                    <AccountSettings />
                  </S>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
  // Admin portal — gated to authenticated ADMIN accounts.
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: (
              <S>
                <AdminOverview />
              </S>
            ),
          },
          {
            path: 'approvals',
            element: (
              <S>
                <AdminApprovals />
              </S>
            ),
          },
          {
            path: 'alerts',
            element: (
              <S>
                <AdminAlerts />
              </S>
            ),
          },
          {
            path: 'reports',
            element: (
              <S>
                <AdminReports />
              </S>
            ),
          },
          {
            path: 'tutors/:id',
            element: (
              <S>
                <AdminTutorReview />
              </S>
            ),
          },
          {
            path: 'tutors',
            element: (
              <S>
                <AdminTutors />
              </S>
            ),
          },
          {
            path: 'students',
            element: (
              <S>
                <AdminStudents />
              </S>
            ),
          },
          {
            path: 'institutes/:id',
            element: (
              <S>
                <AdminInstituteReview />
              </S>
            ),
          },
          {
            path: 'institutes',
            element: (
              <S>
                <AdminInstitutes />
              </S>
            ),
          },
          {
            path: 'bookings',
            element: (
              <S>
                <AdminBookings />
              </S>
            ),
          },
          {
            path: 'payments',
            element: (
              <S>
                <AdminPayments />
              </S>
            ),
          },
          {
            path: 'payout-accounts',
            element: (
              <S>
                <AdminPayoutAccounts />
              </S>
            ),
          },
          {
            path: 'refunds',
            element: (
              <S>
                <AdminRefunds />
              </S>
            ),
          },
          {
            path: 'institute-billing',
            element: (
              <S>
                <AdminInstituteBilling />
              </S>
            ),
          },
          {
            path: 'analytics',
            element: (
              <S>
                <AdminAnalytics />
              </S>
            ),
          },
          {
            path: 'settings',
            element: (
              <S>
                <AdminSettings />
              </S>
            ),
          },
        ],
      },
    ],
  },

  // Tutor onboarding — self-contained full-screen wizard (own layout)
  {
    path: '/signup/tutor/profile',
    element: (
      <S>
        <TutorProfileCreatePage />
      </S>
    ),
  },
  // Payment return from Safepay checkout
  {
    path: '/booking/callback',
    element: (
      <S>
        <BookingCallback />
      </S>
    ),
  },
  {
    path: '*',
    element: (
      <S>
        <NotFoundPage />
      </S>
    ),
  },
];

// Every route nests under RootLayout so scroll behaviour is applied once, in
// one place, rather than being re-mounted by each individual layout.
export const router = createBrowserRouter([{ element: <RootLayout />, children: routes }]);
