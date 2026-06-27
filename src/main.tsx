import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';
import { useUIStore } from '@/store/uiStore';

// Apply persisted theme before first paint.
const { theme } = useUIStore.getState();
if (theme === 'dark') document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
