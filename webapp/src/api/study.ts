import { apiFetch } from './client'

export type ReviewRating = 'again' | 'hard' | 'medium' | 'easy'

/**
 * A card as returned by the study endpoints. Unlike the CRUD card shape, this
 * includes the scheduling fields (fsrsState, nextReview, lastReview) the study
 * UI needs to render and schedule the card without extra round-trips.
 */
export interface StudyCard {
  id: string
  deckId: string
  question: string
  answer: string
  tags: string[]
  fsrsState: unknown
  nextReview: string | null
  lastReview: string | null
  createdAt: string
}

export interface ReviewInput {
  cardId: string
  rating: ReviewRating
  duration?: number
}

export interface ReviewResult {
  id: string
  cardId: string
  rating: number
  duration: number | null
  createdAt: string
}

export interface ReviewResponse {
  card: StudyCard | null
  review: ReviewResult
}

export function getDueCards(deckId: string | undefined, token: string | null, limit = 50) {
  const query = new URLSearchParams({ limit: String(limit) })
  if (deckId) {
    query.set('deckId', deckId)
  }
  return apiFetch<{ cards: StudyCard[] }>(`/api/study/due?${query.toString()}`, { token })
}

export function submitReview(data: ReviewInput, token: string | null) {
  return apiFetch<ReviewResponse>('/api/study/review', { method: 'POST', body: data, token })
}
