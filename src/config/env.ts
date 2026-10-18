/** Typed access to Vite environment variables. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  // Mocks only by default in development: a production build that forgot to set this must talk to
  // the real API, never quietly serve fake tutors and bookings.
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true',
  /**
   * Opens booking payment methods the server does not take yet, against a simulated provider, so
   * the flow can be reviewed before its backend exists. Gated on `DEV` as well as the flag, so a
   * production build cannot carry it whatever the env file says. Defaults on in dev.
   */
  paymentPreview: import.meta.env.DEV && (import.meta.env.VITE_PAYMENT_PREVIEW ?? 'true') === 'true',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  appName: import.meta.env.VITE_APP_NAME ?? 'TopTutor',
  /**
   * Public base URL for marketing assets — the brand film and its poster.
   *
   * A separate bucket from the upload storage on purpose: that one holds CNIC scans and
   * background-check documents, and "public" should never be one config mistake away from
   * "verification documents". Blank hides the video sections rather than rendering a broken
   * player, so a missing deploy variable degrades quietly instead of embarrassingly.
   */
  mediaBaseUrl: (import.meta.env.VITE_MEDIA_BASE_URL ?? '').replace(/\/+$/, ''),
} as const;
