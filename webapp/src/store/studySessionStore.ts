import { create } from 'zustand'
import type { ReviewRating, StudyCard } from '../api/study'

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface StudySessionState {
  /** The deck being studied, or null when studying across all decks. */
  deckId: string | null
  /** The queue of cards remaining to review, in display order. */
  queue: StudyCard[]
  /** The card currently on screen (front of the queue). */
  currentCard: StudyCard | null
  /** Whether the answer has been revealed for the current card. */
  revealed: boolean
  /** True while a rating mutation is in flight. */
  submitting: boolean
  /** Non-null when the last mutation failed; cleared on the next attempt. */
  error: string | null
  /** Count of successfully submitted reviews this session. */
  reviewedCount: number
  status: SessionStatus

  startSession: (deckId: string | null) => void
  setLoading: () => void
  setQueue: (cards: StudyCard[]) => void
  setError: (message: string) => void
  revealAnswer: () => void
  /**
   * Optimistically advance past the current card, removing it from the queue
   * and shifting the next card into view. Returns the card that was just rated
   * so the caller can reconcile with the API response.
   */
  optimisticAdvance: () => StudyCard | null
  /** Append a card to the back of the queue (e.g. the server's next due card). */
  appendCard: (card: StudyCard) => void
  /** Revert the last optimistic advance, restoring the rated card to the front. */
  revertAdvance: (card: StudyCard) => void
  setSubmitting: (submitting: boolean) => void
  setMutationError: (message: string) => void
  clearError: () => void
  endSession: () => void
}

export const useStudySessionStore = create<StudySessionState>((set) => ({
  deckId: null,
  queue: [],
  currentCard: null,
  revealed: false,
  submitting: false,
  error: null,
  reviewedCount: 0,
  status: 'idle',

  startSession: (deckId) =>
    set({
      deckId,
      queue: [],
      currentCard: null,
      revealed: false,
      submitting: false,
      error: null,
      reviewedCount: 0,
      status: 'loading',
    }),

  setLoading: () => set({ status: 'loading', error: null }),

  setQueue: (cards) =>
    set((state) => {
      const queue = [...cards]
      const currentCard = queue.shift() ?? null
      return {
        queue,
        currentCard,
        revealed: false,
        status: currentCard ? 'ready' : 'empty',
        error: null,
      }
    }),

  setError: (message) => set({ status: 'error', error: message }),

  revealAnswer: () => set({ revealed: true }),

  optimisticAdvance: () => {
    let rated: StudyCard | null = null
    set((state) => {
      rated = state.currentCard
      const queue = [...state.queue]
      const currentCard = queue.shift() ?? null
      return {
        queue,
        currentCard,
        revealed: false,
        reviewedCount: state.reviewedCount + 1,
        status: currentCard ? 'ready' : 'empty',
      }
    })
    return rated
  },

  appendCard: (card) =>
    set((state) => ({
      queue: [...state.queue, card],
    })),

  revertAdvance: (card) =>
    set((state) => {
      // Restore the rated card to the front of the queue. Any card that was
      // optimistically appended from the server response is dropped so the
      // queue matches the server's view.
      const queue = [card, ...state.queue]
      return {
        queue,
        currentCard: card,
        revealed: false,
        reviewedCount: Math.max(0, state.reviewedCount - 1),
        status: 'ready',
      }
    }),

  setSubmitting: (submitting) => set({ submitting }),

  setMutationError: (message) => set({ error: message }),

  clearError: () => set({ error: null }),

  endSession: () =>
    set({
      deckId: null,
      queue: [],
      currentCard: null,
      revealed: false,
      submitting: false,
      error: null,
      reviewedCount: 0,
      status: 'idle',
    }),
}))

/** Selector helpers to keep component subscriptions narrow. */
export const selectCurrentCard = (s: StudySessionState) => s.currentCard
export const selectQueueLength = (s: StudySessionState) => s.queue.length
export const selectStatus = (s: StudySessionState) => s.status
export const selectRevealed = (s: StudySessionState) => s.revealed
export const selectSubmitting = (s: StudySessionState) => s.submitting
export const selectError = (s: StudySessionState) => s.error
export const selectReviewedCount = (s: StudySessionState) => s.reviewedCount
