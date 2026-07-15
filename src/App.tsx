import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { PresenceHeartbeat } from '@/components/common/PresenceHeartbeat';
import { router } from '@/routes';

export function App() {
  return (
    <AppProviders>
      <PresenceHeartbeat />
      <RouterProvider router={router} />
    </AppProviders>
  );
}
