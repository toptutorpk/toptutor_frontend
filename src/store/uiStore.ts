import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UIState {
  theme: Theme;
  mobileNavOpen: boolean;
  favorites: string[]; // tutor ids
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setMobileNav: (open: boolean) => void;
  toggleFavorite: (tutorId: string) => void;
  isFavorite: (tutorId: string) => boolean;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      mobileNavOpen: false,
      favorites: ['t1', 't5'],
      toggleTheme() {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        applyTheme(next);
      },
      setTheme(t) {
        set({ theme: t });
        applyTheme(t);
      },
      setMobileNav(open) {
        set({ mobileNavOpen: open });
      },
      toggleFavorite(tutorId) {
        const favorites = get().favorites;
        set({
          favorites: favorites.includes(tutorId)
            ? favorites.filter((id) => id !== tutorId)
            : [...favorites, tutorId],
        });
      },
      isFavorite(tutorId) {
        return get().favorites.includes(tutorId);
      },
    }),
    {
      name: 'toptutor.ui',
      partialize: (s) => ({ theme: s.theme, favorites: s.favorites }),
    },
  ),
);

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}
