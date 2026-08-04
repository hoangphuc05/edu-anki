import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useStartStudySession, useSubmitReviewMutation } from '../hooks/useStudy'
import { useDeckQuery } from '../hooks/useDecks'
import {
  useStudySessionStore,
  selectCurrentCard,
  selectQueueLength,
  selectStatus,
  selectRevealed,
  selectSubmitting,
  selectError,
  selectReviewedCount,
} from '../store/studySessionStore'
import type { ReviewRating } from '../api/study'

export const Route = createFileRoute('/study')({
  component: StudyPage,
  validateSearch: (search: Record<string, unknown>) => ({
    deckId: typeof search.deckId === 'string' && search.deckId ? search.deckId : undefined,
  }),
})

const RATINGS: { value: ReviewRating; label: string; hint: string }[] = [
  { value: 'again', label: 'Again', hint: 'Forgot it' },
  { value: 'hard', label: 'Hard', hint: 'Tough' },
  { value: 'medium', label: 'Good', hint: 'Knew it' },
  { value: 'easy', label: 'Easy', hint: 'Too easy' },
]

function StudyPage() {
  const { deckId } = Route.useSearch()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  const currentCard = useStudySessionStore(selectCurrentCard)
  const queueLength = useStudySessionStore(selectQueueLength)
  const status = useStudySessionStore(selectStatus)
  const revealed = useStudySessionStore(selectRevealed)
  const submitting = useStudySessionStore(selectSubmitting)
  const error = useStudySessionStore(selectError)
  const reviewedCount = useStudySessionStore(selectReviewedCount)

  const startStudySession = useStartStudySession()
  const reviewMutation = useSubmitReviewMutation()

  const deckQuery = useDeckQuery(deckId ?? '')

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login' })
    }
  }, [isLoading, user, navigate])

  // Start a fresh session whenever the deck context changes.
  useEffect(() => {
    if (user) {
      startStudySession(deckId ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, user])

  if (isLoading || !user) {
    return null
  }

  function handleReveal() {
    useStudySessionStore.getState().revealAnswer()
  }

  function handleRate(rating: ReviewRating) {
    if (!currentCard || submitting) return
    reviewMutation.mutate({ cardId: currentCard.id, rating })
  }

  function handleEndSession() {
    useStudySessionStore.getState().endSession()
    navigate({ to: deckId ? '/decks/$deckId' : '/decks', params: deckId ? { deckId } : undefined })
  }

  const deckTitle = deckQuery.data?.deck.title

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Study session</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {deckTitle ?? (deckId ? 'Deck' : 'All decks')}
          </h1>
        </div>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          onClick={handleEndSession}
        >
          End session
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'loading' && <Skeleton />}

      {status === 'error' && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-700">Could not load your study session.</p>
          <button
            type="button"
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            onClick={() => startStudySession(deckId ?? null)}
          >
            Try again
          </button>
        </div>
      )}

      {status === 'empty' && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-900">You're all caught up! 🎉</p>
          <p className="mt-2 text-sm text-slate-600">
            {reviewedCount > 0
              ? `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'} this session.`
              : 'No cards are due right now.'}
          </p>
          <Link
            to={deckId ? '/decks/$deckId' : '/decks'}
            params={deckId ? { deckId } : undefined}
            className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Back to decks
          </Link>
        </div>
      )}

      {status === 'ready' && currentCard && (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                {queueLength + 1} card{queueLength + 1 === 1 ? '' : 's'} remaining
              </span>
              {currentCard.tags.length > 0 && <span>{currentCard.tags.join(', ')}</span>}
            </div>

            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Question</p>
            <p className="mt-2 whitespace-pre-wrap text-xl leading-7 text-slate-950">{currentCard.question}</p>

            {revealed ? (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Answer</p>
                <p className="mt-2 whitespace-pre-wrap text-lg leading-7 text-slate-800">{currentCard.answer}</p>
              </div>
            ) : (
              <button
                type="button"
                className="mt-6 w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={handleReveal}
              >
                Show Answer
              </button>
            )}
          </div>

          {revealed && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATINGS.map((rating) => (
                <button
                  key={rating.value}
                  type="button"
                  className="flex flex-col items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => handleRate(rating.value)}
                >
                  <span>{rating.label}</span>
                  <span className="text-xs font-normal text-slate-500">{rating.hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading study session">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    </div>
  )
}
