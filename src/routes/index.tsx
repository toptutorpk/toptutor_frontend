import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PageLoader } from '@/components/common/PageLoader';

// ---- Lazy pages (code splitting) -------------------------------------------
const HomePage = lazy(() => import('@/pages/HomePage'));
const TutorListingPage = lazy(() => import('@/pages/TutorListingPage'));
const TutorProfilePage = lazy(() => import('@/pages/TutorProfilePage'));
const SubjectsPage = lazy(() => import('@/pages/SubjectsPage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const InstitutesPage = lazy(() => import('@/pages/InstitutesPage'));
const SimplePage = lazy(() => import('@/pages/SimplePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupChoicePage = lazy(() => import('@/pages/auth/SignupChoicePage'));
const StudentSignupPage = lazy(() => import('@/pages/auth/StudentSignupPage'));
const TutorSignupPage = lazy(() => import('@/pages/auth/TutorSignupPage'));
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
const ProfileSettings = lazy(() => import('@/pages/dashboard/ProfileSettings'));

// Tutor dashboard
const TutorAnalytics = lazy(() => import('@/pages/dashboard/tutor/Analytics'));
const TutorEarnings = lazy(() => import('@/pages/dashboard/tutor/Earnings'));
const TutorSchedule = lazy(() => import('@/pages/dashboard/tutor/Schedule'));
const TutorVerification = lazy(() => import('@/pages/dashboard/tutor/Verification'));
const TutorPlaceholder = lazy(() => import('@/pages/dashboard/tutor/TutorPlaceholder'));

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <S><HomePage /></S> },
      { path: '/tutors', element: <S><TutorListingPage /></S> },
      { path: '/tutors/:slug', element: <S><TutorProfilePage /></S> },
      { path: '/subjects', element: <S><SubjectsPage /></S> },
      { path: '/subjects/:slug', element: <S><TutorListingPage /></S> },
      { path: '/how-it-works', element: <S><HowItWorksPage /></S> },
      { path: '/pricing', element: <S><PricingPage /></S> },
      { path: '/institutes', element: <S><InstitutesPage /></S> },
      { path: '/about', element: <S><SimplePage title="About TopTutor" /></S> },
      { path: '/blog', element: <S><SimplePage title="Blog" /></S> },
      { path: '/careers', element: <S><SimplePage title="Careers" /></S> },
      { path: '/contact', element: <S><SimplePage title="Contact Us" /></S> },
      { path: '/child-safety', element: <S><SimplePage title="Child Safety" /></S> },
      { path: '/privacy', element: <S><SimplePage title="Privacy Policy" /></S> },
      { path: '/terms', element: <S><SimplePage title="Terms of Service" /></S> },
      { path: '/report', element: <S><SimplePage title="Report Misconduct" /></S> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <S><LoginPage /></S> },
      { path: '/signup', element: <S><SignupChoicePage /></S> },
      { path: '/signup/student', element: <S><StudentSignupPage /></S> },
      { path: '/signup/tutor', element: <S><TutorSignupPage /></S> },
      { path: '/forgot-password', element: <S><ForgotPasswordPage /></S> },
      { path: '/reset-password', element: <S><ResetPasswordPage /></S> },
      { path: '/verify-otp', element: <S><OtpVerificationPage /></S> },
      { path: '/verify-email', element: <S><EmailVerificationPage /></S> },
      { path: '/welcome', element: <S><WelcomePage /></S> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard/student',
        element: <DashboardLayout role="student" />,
        children: [
          { index: true, element: <S><StudentOverview /></S> },
          { path: 'bookings', element: <S><StudentBookings /></S> },
          { path: 'messages', element: <S><MessagesPage /></S> },
          { path: 'favorites', element: <S><StudentFavorites /></S> },
          { path: 'payments', element: <S><StudentPayments /></S> },
          { path: 'reviews', element: <S><StudentReviews /></S> },
          { path: 'profile', element: <S><ProfileSettings /></S> },
          { path: 'settings', element: <S><ProfileSettings /></S> },
        ],
      },
      {
        path: '/dashboard/tutor',
        element: <DashboardLayout role="tutor" />,
        children: [
          { index: true, element: <S><TutorAnalytics /></S> },
          { path: 'earnings', element: <S><TutorEarnings /></S> },
          { path: 'schedule', element: <S><TutorSchedule /></S> },
          { path: 'sessions', element: <S><TutorPlaceholder title="Sessions" /></S> },
          { path: 'students', element: <S><TutorPlaceholder title="My Students" /></S> },
          { path: 'reviews', element: <S><TutorPlaceholder title="Reviews" /></S> },
          { path: 'messages', element: <S><MessagesPage /></S> },
          { path: 'verification', element: <S><TutorVerification /></S> },
          { path: 'profile', element: <S><ProfileSettings /></S> },
        ],
      },
    ],
  },
  { path: '/dashboard', element: <Navigate to="/dashboard/student" replace /> },
  { path: '*', element: <S><NotFoundPage /></S> },
]);
