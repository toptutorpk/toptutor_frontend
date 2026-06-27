/** Typed access to Vite environment variables. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  appName: import.meta.env.VITE_APP_NAME ?? 'TopTutor',
} as const;
