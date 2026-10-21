import { bookingLabel, bookingMoney } from '@/lib/adminBookings';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookingField,
  BookingMode,
  BookingPartyLink,
  BookingState,
} from '@/components/admin/BookingDisplay';
import { adminBookingService } from '@/services/adminBookingService';

const stamp = (value?: string) =>
  value ? new Date(value).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : undefined;
export default function AdminBookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const valid = /^[1-9]\d*$/.test(id ?? '') && Number.isSafeInteger(bookingId);
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;
  const backTo =
    typeof from === 'string' && /^\/admin\/bookings(?:\/accounts\/[1-9]\d*)?(?:\?|$)/.test(from)
      ? from
      : '/admin/bookings';
  const query = useQuery({
    queryKey: ['admin', 'bookings', 'detail', bookingId],
    queryFn: ({ signal }) => adminBookingService.detail(bookingId, signal),
    enabled: valid,
  });
  const detail = query.data;
  const b = detail?.booking;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={backTo} aria-label="Back to bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">
            Booking {valid ? `#${bookingId}` : 'details'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Session, payment and classroom information.
          </p>
        </div>
      </div>
      {!valid || query.isError ? (
        <div className="space-y-3 rounded-2xl border bg-card p-6" role="alert">
          <p>Could not load this booking. It may not exist or may no longer be available.</p>
          {valid && (
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          )}
        </div>
      ) : query.isPending ? (
        <div className="space-y-4" aria-label="Loading booking">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : b && detail ? (
        <>
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold">Booking overview</h2>
              <div className="flex gap-2">
                <BookingState value={b.status} />
                <BookingState value={b.paymentStatus} />
              </div>
            </div>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <BookingField
                label="Tutor"
                value={<BookingPartyLink party={b.tutor} from={backTo} />}
              />
              <BookingField
                label="Student / Parent"
                value={<BookingPartyLink party={b.learner} from={backTo} />}
              />
              <BookingField label="Child" value={b.childName} />
              <BookingField label="Subject" value={b.subject} />
              <BookingField
                label="Booking type"
                value={b.bookingType === 'INTRO' ? 'Free introduction' : 'Paid session'}
              />
              <BookingField label="Mode" value={<BookingMode mode={b.mode} />} />
              <BookingField label="Session date (PKT)" value={b.sessionDate} />
              <BookingField
                label="Session time (PKT)"
                value={b.startTime && b.endTime ? `${b.startTime}–${b.endTime}` : undefined}
              />
              <BookingField label="Schedule" value={bookingLabel(b.scheduleStatus)} />
              <BookingField label="Created (PKT)" value={stamp(b.createdAt)} />
              <BookingField label="Booking note" value={detail.note} />
            </dl>
          </section>
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-bold">Payment breakdown</h2>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <BookingField
                label="Payment status"
                value={<BookingState value={b.paymentStatus} />}
              />
              <BookingField
                label="Session price"
                value={
                  b.bookingType === 'INTRO' && b.sessionAmount == null
                    ? 'Free'
                    : bookingMoney(b.sessionAmount, b.currency)
                }
              />
              <BookingField
                label="Processing fee"
                value={bookingMoney(b.processingFee, b.currency)}
              />
              <BookingField
                label="Total charge"
                value={
                  b.bookingType === 'INTRO' && b.totalAmount == null
                    ? 'Free'
                    : bookingMoney(b.totalAmount, b.currency)
                }
              />
              <BookingField
                label="Platform commission"
                value={bookingMoney(detail.platformFee, b.currency)}
              />
              <BookingField
                label="Tutor net allocation"
                value={bookingMoney(detail.tutorNet, b.currency)}
              />
              <BookingField label="Paid at (PKT)" value={stamp(detail.paidAt)} />
              <BookingField label="Receipt number" value={detail.receiptNumber} />
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              A payment or net allocation does not confirm attendance or payout. Cancelled sessions
              are excluded from tutor earnings.
            </p>
          </section>
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-bold">Cancellation & refund</h2>
            {detail.refundStatus ? (
              <>
                <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <BookingField
                    label="Refund status"
                    value={<BookingState value={detail.refundStatus} />}
                  />
                  <BookingField label="Cancelled by" value={bookingLabel(detail.cancelledBy)} />
                  <BookingField
                    label="Refund amount"
                    value={bookingMoney(detail.refundAmount, b.currency)}
                  />
                  <BookingField
                    label="Deduction"
                    value={bookingMoney(detail.refundFee, b.currency)}
                  />
                  <BookingField label="Reason" value={detail.cancellationReason} />
                  <BookingField label="Refunded at (PKT)" value={stamp(detail.refundedAt)} />
                </dl>
                <Button className="mt-4" variant="outline" size="sm" asChild>
                  <Link to="/admin/refunds">Open refund management</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {b.status === 'CANCELLED'
                  ? 'This booking is cancelled. No refund record is available.'
                  : 'No cancellation or refund record.'}
              </p>
            )}
          </section>
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-bold">Classroom & review</h2>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <BookingField
                label="Classroom processing"
                value={bookingLabel(detail.classroomStatus)}
              />
              <BookingField
                label="Recorded outcome"
                value={
                  detail.classroomOutcome ? (
                    <BookingState value={detail.classroomOutcome} />
                  ) : undefined
                }
              />
              <BookingField
                label="Participants meeting attendance threshold"
                value={detail.participants}
              />
              <BookingField
                label="Longest recorded attendance (minutes)"
                value={detail.attendedMinutes}
              />
              <BookingField
                label="Classroom closed (PKT)"
                value={stamp(detail.classroomClosedAt)}
              />
              <BookingField
                label="Learner rating"
                value={
                  detail.reviewRating != null ? `${detail.reviewRating} / 5` : 'No review submitted'
                }
              />
            </dl>
          </section>
        </>
      ) : null}
    </div>
  );
}
