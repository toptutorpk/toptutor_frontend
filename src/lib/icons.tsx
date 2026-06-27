import {
  Activity,
  Atom,
  Banknote,
  BookMarked,
  BookOpen,
  BookOpenText,
  Calculator,
  CalendarCheck,
  CalendarDays,
  Circle,
  Clock,
  Code2,
  Dna,
  FlaskConical,
  GraduationCap,
  Heart,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sigma,
  Sparkles,
  Star,
  Terminal,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Explicit icon registry. Components reference icons by string name (icons come
 * from data), so we map only the icons we actually use — keeping the bundle
 * tree-shakeable instead of importing all of lucide-react.
 */
export const ICONS: Record<string, LucideIcon> = {
  Activity,
  Atom,
  Banknote,
  BookMarked,
  BookOpen,
  BookOpenText,
  Calculator,
  CalendarCheck,
  CalendarDays,
  Circle,
  Clock,
  Code2,
  Dna,
  FlaskConical,
  GraduationCap,
  Heart,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sigma,
  Sparkles,
  Star,
  Terminal,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
};

interface DynamicIconProps {
  name?: string;
  className?: string;
  fallback?: LucideIcon;
}

/** Render a lucide icon by name from the registry. */
export function DynamicIcon({ name, className, fallback = Circle }: DynamicIconProps) {
  const Cmp = (name && ICONS[name]) || fallback;
  return <Cmp className={cn(className)} />;
}
