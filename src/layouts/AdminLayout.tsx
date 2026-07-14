import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, Menu, Search, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { ADMIN_NAV } from '@/constants/navigation';

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="lg:grid lg:grid-cols-[272px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r bg-background lg:block">
          <DashboardSidebar items={ADMIN_NAV} />
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <DashboardSidebar items={ADMIN_NAV} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Badge variant="gold" className="hidden sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin Console
            </Badge>

            <div className="relative ml-1 hidden max-w-sm flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search tutors, students, institutes…" className="h-10 pl-9" />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
              </Button>
              <div className="flex items-center gap-2 rounded-full p-1">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-brand-600 text-white">AD</AvatarFallback>
                </Avatar>
                <div className="hidden pr-2 text-sm leading-tight md:block">
                  <div className="font-semibold">Admin</div>
                  <div className="text-xs text-muted-foreground">Super admin</div>
                </div>
              </div>
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
