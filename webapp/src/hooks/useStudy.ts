import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import * as studyApi from '../api/study'
import type { ReviewRating } from '../api/study'
import { useStudySessionStore } from '../store/studySessionStore'

/**
 * Load the due-card queue for a deck (or all decks) into the session store.
 * Returns a function that starts a fresh session and fetches the queue.
 */
export function useStartStudySession() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return async function startStudySession(deckId: string | null) {
    const store = useStudySessionStore.getState()
    store.startSession(deckId)
    try {
      const { cards } = await studyApi.getDueCards(deckId ?? undefined, accessToken)
      useStudySessionStore.getState().setQueue(cards)
    } catch (err) {
      useStudySessionStore
        .getState()
        .setError(err instanceof Error ? err.message : 'Failed to load due cards')
    }
  }
}

/**
 * Submit a rating for the currently displayed card with an optimistic update:
 * the card is removed from the local queue immediately, then reconciled with
 * the server response. On failure the card is restored to the front of the
 * queue and a clear error is surfaced.
 */
export function useSubmitReviewMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, rating, duration }: { cardId: string; rating: ReviewRating; duration?: number }) =>
      studyApi.submitReview({ cardId, rating, duration }, accessToken),

    onMutate: async ({ cardId, rating }) => {
      const store = useStudySessionStore.getState()
      // Guard against rating a card that is no longer displayed (e.g. a stale
      // click after the queue advanced). Keying by card id prevents applying a
      // rating to the wrong card.
      if (store.currentCard?.id !== cardId) {
        throw new Error('This card is no longer on screen. Please try again.')
      }
      store.setSubmitting(true)
      store.clearError()
      // Optimistically advance past the current card. The server response will
      // reconcile the next due card.
      const rated = store.optimisticAdvance()
      return { rated, rating }
    },

    onSuccess: (data, _variables, context) => {
      const store = useStudySessionStore.getState()
      // Reconcile with the server: if it returned a next due card, append it to
      // the queue so the session continues without a refetch.
      if (data.card) {
        store.appendCard(data.card)
      }
      store.setSubmitting(false)
    },

    onError: (err, _variables, context) => {
      const store = useStudySessionStore.getState()
      // Revert the optimistic advance so the rated card returns to the front.
      if (context?.rated) {
        store.revertAdvance(context.rated)
      }
      store.setSubmitting(false)
      store.setMutationError(err instanceof Error ? err.message : 'Failed to save your rating')
    },

    onSettled: () => {
      // Keep the deck/card caches fresh after a review changes scheduling.
      queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}
