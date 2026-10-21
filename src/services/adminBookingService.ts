import { http } from '@/api/client';
export interface BookingParty {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}
export interface AdminBooking {
  id: number;
  tutor: BookingParty;
  learner: BookingParty;
  childName?: string;
  subject?: string;
  mode?: string;
  bookingType: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  scheduleStatus: string;
  paymentStatus: string;
  sessionAmount?: number;
  processingFee: number;
  totalAmount?: number;
  currency?: string;
  createdAt?: string;
}
export interface BookingStats {
  total: number;
  upcoming: number;
  past: number;
  cancelled: number;
  totalPaid: number;
  refunded: number;
  tutorNet: number;
}
export interface AdminBookingDetail {
  booking: AdminBooking;
  note?: string;
  paidAt?: string;
  receiptNumber?: string;
  platformFee?: number;
  tutorNet?: number;
  refundStatus?: string;
  refundAmount?: number;
  refundFee?: number;
  cancelledBy?: string;
  cancellationReason?: string;
  refundedAt?: string;
  classroomStatus?: string;
  classroomOutcome?: string;
  participants?: number;
  attendedMinutes?: number;
  classroomClosedAt?: string;
  reviewRating?: number;
}
export interface BookingFilters {
  page: number;
  size: number;
  accountId?: number;
  status?: string;
  payment?: string;
  mode?: string;
  from?: string;
  to?: string;
  search?: string;
}
export const adminBookingService = {
  list: (params: BookingFilters, signal?: AbortSignal) =>
    http.getPage<AdminBooking>('/admin/bookings', { params: { ...params }, signal }),
  stats: (accountId?: number) =>
    http.get<BookingStats>('/admin/bookings/stats', { params: { accountId } }),
  account: (id: number) => http.get<BookingParty>(`/admin/bookings/accounts/${id}`),
  detail: (id: number, signal?: AbortSignal) =>
    http.get<AdminBookingDetail>(`/admin/bookings/${id}`, { signal }),
};
