import { Link } from 'react-router-dom';
import { Video, Home, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BookingParty } from '@/services/adminBookingService';
import { toNationalDisplay } from '@/lib/phone';
import { bookingLabel } from '@/lib/adminBookings';
export function BookingMode({ mode }: { mode?: string }) {
  const Icon = mode === 'HOME' ? Home : mode === 'DEMO' ? Building2 : Video;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
      {mode && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {mode === 'HOME' ? 'Home visit' : bookingLabel(mode)}
    </span>
  );
}
export function BookingState({ value }: { value: string }) {
  return (
    <Badge
      variant={
        ['PAID', 'COMPLETED', 'REFUNDED'].includes(value)
          ? 'success'
          : ['FAILED', 'CANCELLED', 'NOT_HELD', 'ONE_SIDED'].includes(value)
            ? 'destructive'
            : ['PENDING', 'REQUESTED', 'AWAITING_DETAILS'].includes(value)
              ? 'gold'
              : 'secondary'
      }
    >
      {bookingLabel(value)}
    </Badge>
  );
}
export function BookingPartyLink({
  party,
  from,
  showRole = true,
}: {
  party: BookingParty;
  from?: string;
  showRole?: boolean;
}) {
  return (
    <div className="min-w-[10rem] max-w-[16rem]">
      <Link
        className="font-medium hover:text-primary hover:underline"
        to={`/admin/bookings/accounts/${party.id}`}
        state={{ from }}
        aria-label={`View bookings for ${party.name}`}
      >
        {party.name}
      </Link>
      <p className="mt-0.5 break-all text-xs text-muted-foreground">
        {party.email || toNationalDisplay(party.phone) || 'Contact unavailable'}
      </p>
      {showRole && <p className="text-xs text-muted-foreground">{bookingLabel(party.role)}</p>}
    </div>
  );
}
export function BookingField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">
        {value ?? 'Not recorded'}
      </dd>
    </div>
  );
}
