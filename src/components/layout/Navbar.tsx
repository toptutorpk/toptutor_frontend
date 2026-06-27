import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, LayoutDashboard, LogOut, User as UserIcon, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAIN_NAV } from '@/constants/navigation';
import { Logo } from '@/components/common/Logo';
import { Container } from '@/components/common/Container';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardPath =
    user?.role === 'tutor' ? '/dashboard/tutor' : '/dashboard/student';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled ? 'glass border-b shadow-sm' : 'bg-transparent',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-18">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                    isActive && 'text-foreground bg-secondary',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Search"
            onClick={() => navigate('/tutors')}
          >
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border bg-background p-1 pr-3 transition-colors hover:bg-secondary">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold text-foreground">{user.name}</div>
                  <div className="text-xs font-normal capitalize text-muted-foreground">
                    {user.role} account
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                  <LayoutDashboard /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/student/favorites')}>
                  <Heart /> Favorites
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/student/profile')}>
                  <UserIcon /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button variant="gradient" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4">
                {MAIN_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-secondary',
                        isActive && 'bg-secondary text-primary',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                {!isAuthenticated && (
                  <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                    <Button variant="outline" asChild>
                      <Link to="/login" onClick={() => setOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button variant="gradient" asChild>
                      <Link to="/signup" onClick={() => setOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
