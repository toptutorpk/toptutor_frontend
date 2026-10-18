# TopTutor Frontend — Production Setup

The frontend is a static single-page app (React + Vite). Production needs **build-time
configuration** and a static host. Nothing secret is committed: `.env` and `.env.local` are
git-ignored, and every `VITE_*` value ends up in public JavaScript, so never put a secret in one.

---

## 1. Build

| Item | Value |
|---|---|
| Node.js | 20 LTS or newer |
| Install | `npm ci` |
| Build | `npm run build` → static files in `dist/` |
| Serve | any static host (Cloudflare Pages, Netlify, Nginx, S3 + CDN) |

`VITE_*` variables are read **when you build**, not when the site runs — change one and you must
rebuild and redeploy.

## 2. Build-time variables

| Variable | Production value |
|---|---|
| `VITE_API_BASE_URL` | **Required.** Full HTTPS URL of the backend API, e.g. `https://api.toptutor.pk/api/v1`. Without it the build points at `http://localhost:8080`. Must be HTTPS — the page's security policy blocks plain HTTP. |
| `VITE_USE_MOCKS` | `false`. (Production builds already default to `false`; set it explicitly anyway.) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth **Web** client id for "Sign in with Google" — the same client the backend's `GOOGLE_CLIENT_ID` trusts. Add the production site to its Authorized JavaScript origins in Google Cloud Console. |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps key, **restricted to your domain** in Google Cloud Console (it is public). |
| `VITE_MEDIA_BASE_URL` | Public R2 bucket/CDN for marketing media (brand film, poster). Blank hides those sections. |
| `VITE_APP_NAME` | `TopTutor` |

Copy `.env.example` to `.env.production` (git-ignored) on the build machine, or set these in the
host's build settings.

## 3. Host configuration

1. **SPA fallback** — every unknown path must serve `index.html` (status 200), or reloading
   `/dashboard/...` gives a 404.
   - Cloudflare Pages / Netlify: already handled by `public/_redirects` (`/*  /index.html  200`).
   - Nginx: `try_files $uri /index.html;`
2. **Security headers** — `public/_headers` is honoured by Cloudflare Pages and Netlify. On any
   other host, set the same headers in its config (X-Frame-Options, nosniff, Referrer-Policy,
   HSTS, Permissions-Policy). Only enable HSTS once the whole site is on HTTPS.
3. **HTTPS** on the site's domain.

## 4. Backend values that must match

| Backend variable | Must equal |
|---|---|
| `FRONTEND_URL` | The site's origin, e.g. `https://toptutor.pk` |
| `PASSWORD_RESET_URL` | `https://toptutor.pk/reset-password` |
| `CORS_ALLOWED_ORIGINS` | The site's origin(s), including `www.` if used |
| `REFRESH_COOKIE_DOMAIN` | Parent domain (e.g. `.toptutor.pk`) when the site and API are on sub-domains |

Live notifications and messages use a WebSocket at `wss://<api-domain>/ws`, derived from
`VITE_API_BASE_URL`. The proxy in front of the backend must allow WebSocket upgrades on `/ws`.

## 5. Before taking real payments

- **Card (Safepay)** is the only live payment method. Easypaisa, JazzCash and bank transfer show
  as "coming soon" in production builds.
- `src/constants/payment.ts` → `BOOKING_BANK_ACCOUNT` still holds **placeholder** bank details
  (`0000 …`). Replace them with TopTutor's real account **before** bank transfer is switched on.

## 6. Smoke test after deploy

1. Open the site and reload a deep link (e.g. `/tutors`) — no 404.
2. Sign up / log in; check the browser console has no CORS or Content-Security-Policy errors.
3. Sign in with Google.
4. Open a tutor profile — real data, not mock tutors.
5. Book and pay a small session by card; the booking turns PAID and appears under My Bookings.
6. The notification bell updates live (WebSocket over `wss://`).
