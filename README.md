# TopTutor — Frontend

Pakistan's first **7-step verified** tutoring marketplace. A production-grade React frontend built to the _TutorVerify PK_ PRD, with an original design language inspired by (not copied from) modern marketplaces like TutorOcean.

> Brand: **TopTutor** · Market: Pakistan · Currency: PKR · Payments: JazzCash, Easypaisa, Card (escrow)

---

## ✨ Highlights

- **World-class landing page** — animated hero search, rotating placeholders, floating trust cards, scroll-reveal sections, animated stat counters, learning journey, testimonials, pricing & FAQ.
- **Tutor marketplace** — rich, information-dense tutor cards, full filter panel (subject, city, price slider, mode, language, gender, rating, verified-only), sort, URL-synced filters, active-filter chips, pagination, skeleton/empty/error states.
- **Tutor profile** — cover + avatar, verification badge, video intro, tabbed About / Subjects / **7-step Verification timeline** / Reviews, rating breakdown, education & certifications, and a sticky booking panel with a 3-step **book → escrow pay → success** flow.
- **Complete auth module** — login, role-choice signup, parent & multi-step tutor signup, forgot/reset password, **6-digit OTP** (paste-aware), email verification, and a celebratory welcome screen — all on a split brand layout.
- **Dashboards** — student (overview, bookings, favorites, payments, reviews, profile/settings) and tutor (analytics with charts, earnings, schedule grid, verification, messages) with a responsive sidebar shell.
- **Messaging** — encrypted-style chat UI with conversation list and live composer.
- **Design system** — tokenized Tailwind v4 theme, dark mode, glassmorphism, gradients, 20+ shadcn/Radix UI primitives, and reusable cards/states/animations.
- **Engineered for performance** — route-level code splitting, tree-shaken icons, manual vendor chunks, lazy images. Main bundle ~122 kB gzip.

## 🧱 Tech Stack

React 19 · Vite 6 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui + Radix UI · Framer Motion · React Router 7 · TanStack Query · Axios · React Hook Form · Zod · Zustand · Lucide · Sonner · ESLint · Prettier.

## 🚀 Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run format     # prettier
```

### Demo login

The app ships with **mock services enabled** (`VITE_USE_MOCKS=true`), so no backend is needed.

- **Log in** with any phone number + any 6+ character password.
- Or sign up as a parent and verify with **any 6-digit OTP**.

## 🔌 Connecting the Spring Boot backend

All data flows through a typed service layer (`src/services/*`) backed by a central Axios client (`src/api/client.ts`). Each service falls back to in-memory mocks when `VITE_USE_MOCKS=true`, and hits the real API otherwise.

```bash
# .env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCKS=false
```

Endpoints expected by the services: `/auth/*`, `/tutors`, `/tutors/:slug`, `/subjects`, `/stats`, `/bookings`, `/conversations`, `/notifications`. Swap mocks for real responses with zero component changes.

## 📁 Project Structure

```
src/
├── api/            # axios client, query keys
├── app/            # providers (QueryClient, tooltip, toaster)
├── components/
│   ├── ui/         # shadcn/Radix primitives (button, dialog, select…)
│   ├── common/     # Logo, RatingStars, VerificationBadge, states, pagination…
│   ├── layout/     # Navbar, Footer
│   ├── home/       # landing-page sections
│   ├── cards/      # TutorCard, SubjectCard, PricingCard
│   ├── search/     # FilterPanel
│   ├── tutor/      # VerificationSteps
│   ├── booking/    # BookingPanel + flow
│   ├── reviews/    # ReviewCard
│   ├── dashboard/  # sidebar, stat cards, mini chart
│   ├── auth/       # OtpInput, social buttons, headers
│   └── animations/ # Reveal, Stagger, AnimatedCounter
├── config/         # typed env
├── constants/      # cities, subjects, 7 verification steps, navigation
├── hooks/          # useTutors, useDebounce
├── layouts/        # MainLayout, AuthLayout, DashboardLayout
├── lib/            # cn() + formatters, icon registry
├── pages/          # route pages (public, auth, dashboard)
├── routes/         # router + ProtectedRoute
├── services/       # API + mock data
├── store/          # Zustand (auth, ui/theme/favorites)
├── styles/         # Tailwind v4 tokens & globals
└── types/          # domain models
```

## 🎨 Design Tokens

Brand teal (trust + growth) with a gold accent for verification & ratings. Light/dark themes via CSS variables, `font-display` (Plus Jakarta Sans) for headings and Inter for body. Verification badge colors map directly to the PRD: **Verified** (green), **Partial** (amber), **Under Review** (blue), **Rejected** (red).

## ♿ Accessibility & Responsiveness

Semantic HTML, ARIA labels, keyboard-navigable Radix primitives, visible focus rings, and fully responsive layouts (mobile → desktop) with no horizontal scroll.

---

_Mock data uses public placeholder avatars/images (pravatar, picsum, unsplash). Replace with real assets before production._
