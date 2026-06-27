import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/lib/icons';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import type { NavItem } from '@/constants/navigation';
import { useAuthStore } from '@/store/authStore';

export function DashboardSidebar({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 3}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground',
                isActive &&
                  'bg-gradient-to-r from-brand-50 to-transparent text-brand-700 dark:from-brand-500/10 dark:text-brand-400 shadow-sm',
              )
            }
          >
            <DynamicIcon name={item.icon} className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </Button>
      </div>
    </div>
  );
}
