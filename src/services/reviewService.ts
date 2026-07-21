import { http } from '@/api/client';

/** A review the signed-in student wrote (mirrors backend StudentReviewResponse). */
export interface StudentReview {
  id: number;
  tutorId: number;
  tutorName: string;
  tutorAvatar: string | null;
  rating: number;
  comment: string | null;
  date: string; // ISO
  tutorResponse: string | null;
}

/** A completed session the student hasn't reviewed yet (mirrors backend PendingReviewResponse). */
export interface PendingReview {
  bookingId: number;
  tutorId: number;
  tutorName: string;
  tutorAvatar: string | null;
  sessionDate: string; // 'YYYY-MM-DD'
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

/** A review the signed-in tutor received (mirrors backend TutorReviewResponse). */
export interface TutorReview {
  id: number;
  studentId: number;
  studentName: string;
  studentAvatar: string | null;
  rating: number;
  comment: string | null;
  date: string; // ISO
  tutorResponse: string | null;
  respondedAt: string | null;
}

/** One review on a public tutor profile (mirrors backend PublicReviewResponse). */
export interface PublicReview {
  id: number;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  comment: string | null;
  date: string; // ISO
  tutorResponse: string | null;
}

/** Public reviews block for a tutor (mirrors backend PublicReviewsResponse). */
export interface PublicReviews {
  rating: number | null;
  reviewCount: number;
  reviews: PublicReview[];
}

export const reviewService = {
  /** Student: submit a rating (+ optional comment) for a completed session. */
  create: (bookingId: number, rating: number, comment?: string) =>
    http.post<StudentReview>('/reviews', { bookingId, rating, comment }),
  /** Student: reviews I've written. */
  mine: () => http.get<StudentReview[]>('/reviews/mine'),
  /** Student: completed sessions I can still review. */
  pending: () => http.get<PendingReview[]>('/reviews/pending'),
  /** Tutor: reviews I've received. */
  received: () => http.get<TutorReview[]>('/reviews/received'),
  /** Tutor: reply to a review I received. */
  respond: (reviewId: number, response: string) =>
    http.post<void>(`/reviews/${reviewId}/response`, { response }),
  /** Public: a tutor's aggregate rating + review list. */
  publicForTutor: (tutorId: number) => http.get<PublicReviews>(`/public/tutors/${tutorId}/reviews`),
};
