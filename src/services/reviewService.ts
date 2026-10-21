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
  /** How many people marked it helpful. */
  helpfulCount: number;
  /** The signed-in viewer marked it helpful (false when signed out). */
  helpful: boolean;
  /** The viewer wrote it or is the reviewed tutor — they can't vote on it. */
  own: boolean;
}

/** Public reviews block for a tutor (mirrors backend PublicReviewsResponse). */
export interface PublicReviews {
  rating: number | null;
  reviewCount: number;
  reviews: PublicReview[];
  /** How many reviews have each star rating, keys "1".."5". Always over ALL reviews. */
  ratingCounts: Record<string, number>;
  /** Zero-based page of `reviews`. */
  page: number;
  size: number;
  /** Reviews matching the star filter — what the pager pages through. */
  total: number;
}

export type PublicReviewSort = 'NEWEST' | 'HIGHEST' | 'LOWEST' | 'HELPFUL';

export interface PublicReviewQuery {
  page: number;
  size: number;
  sort: PublicReviewSort;
  /** Only this star level; omitted for all. */
  rating?: number;
}

/** A review's helpful count after the viewer's vote. */
export interface HelpfulResult {
  helpfulCount: number;
  helpful: boolean;
}

export const reviewService = {
  /** Student: submit a rating (+ optional comment) for a completed session. */
  create: (bookingId: number, rating: number, comment?: string) =>
    http.post<StudentReview>('/reviews', { bookingId, rating, comment }),
  /** Student: reviews I've written. */
  mine: () => http.get<StudentReview[]>('/reviews/mine', { params: { size: 100 } }),
  /** Student: completed sessions I can still review. */
  pending: () => http.get<PendingReview[]>('/reviews/pending', { params: { size: 100 } }),
  /** Tutor: reviews I've received. */
  received: () => http.get<TutorReview[]>('/reviews/received', { params: { size: 100 } }),
  /** Tutor: reply to a review I received. */
  respond: (reviewId: number, response: string) =>
    http.post<void>(`/reviews/${reviewId}/response`, { response }),
  /** Public: a tutor's aggregate rating + review list. */
  /** Public: a tutor's rating summary and ONE page of reviews, filtered and sorted by the server. */
  publicForTutor: (tutorId: number, q: PublicReviewQuery) =>
    http.get<PublicReviews>(`/public/tutors/${tutorId}/reviews`, {
      params: { page: q.page, size: q.size, sort: q.sort, rating: q.rating },
    }),
  /** Signed-in: mark a review helpful, or take the vote back. One vote per person. */
  setHelpful: (reviewId: number, helpful: boolean) =>
    helpful
      ? http.put<HelpfulResult>(`/reviews/${reviewId}/helpful`)
      : http.del<HelpfulResult>(`/reviews/${reviewId}/helpful`),
};
