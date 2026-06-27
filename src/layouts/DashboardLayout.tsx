import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DASHBOARD_NAV_BY_ROLE, STUDENT_DASHBOARD_NAV } from '@/constants/navigation';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';

interface DashboardLayoutProps {
  role?: 'student' | 'tutor';
}

export function DashboardLayout({ role = 'student' }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const items = DASHBOARD_NAV_BY_ROLE[role] ?? STUDENT_DASHBOARD_NAV;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="lg:grid lg:grid-cols-[272px_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen border-r bg-background lg:block">
          <DashboardSidebar items={items} />
        </aside>

        <div className="flex min-h-screen flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <DashboardSidebar items={items} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="relative hidden max-w-sm flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" className="h-10 pl-9" />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
              </Button>
              <button
                onClick={() => navigate(`/dashboard/${role}/profile`)}
                className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-secondary"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback>{getInitials(user?.name ?? 'TT')}</AvatarFallback>
                </Avatar>
              </button>
            </div>
          </header>

          <main className="flex-1 py-6 lg:py-8">
            <Container size="wide">
              <Outlet />
            </Container>
          </main>
        </div>
      </div>
    </div>
  );
}
