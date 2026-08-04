import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext.jsx'
import { routeTree } from '../routeTree.gen'
import { useStudySessionStore } from '../store/studySessionStore'

function jsonResponse(body: unknown, ok: boolean) {
  return {
    ok,
    json: async () => body,
  } as Response
}

const AUTHED_USER = { id: 'u1', email: 'owner@example.com' }
const DECK = { id: 'd1', title: 'Spanish Vocab', description: 'Basics', userId: 'u1', createdAt: '' }
const CARD_1 = {
  id: 'c1',
  deckId: 'd1',
  question: 'Hola?',
  answer: 'Hello',
  tags: ['greeting'],
  fsrsState: {},
  nextReview: null,
  lastReview: null,
  createdAt: '',
}
const CARD_2 = {
  id: 'c2',
  deckId: 'd1',
  question: 'Adiós?',
  answer: 'Goodbye',
  tags: ['greeting'],
  fsrsState: {},
  nextReview: null,
  lastReview: null,
  createdAt: '',
}

function renderAtPath(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>,
  )

  return { router }
}

describe('Study route', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    // Reset the singleton store between tests.
    useStudySessionStore.getState().endSession()
  })

  it('renders the active deck context and the first card in the queue', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [CARD_1, CARD_2] } }, true)) // GET deck
      .mockResolvedValueOnce(jsonResponse({ cards: [CARD_1, CARD_2] }, true)) // GET due cards

    renderAtPath('/study?deckId=d1')

    await waitFor(() => expect(screen.getByText('Spanish Vocab')).toBeInTheDocument())
    expect(screen.getByText('Hola?')).toBeInTheDocument()
    expect(screen.getByText('2 cards remaining')).toBeInTheDocument()
    // Answer is hidden until revealed.
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show Answer' })).toBeInTheDocument()
  })

  it('reveals the answer without a page reload', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [CARD_1] } }, true)) // GET deck
      .mockResolvedValueOnce(jsonResponse({ cards: [CARD_1] }, true)) // GET due cards

    renderAtPath('/study?deckId=d1')

    await waitFor(() => expect(screen.getByText('Hola?')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Show Answer' }))

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /again/i })).toBeInTheDocument()
    // No reload: the fetch mock was only called for refresh + deck + due.
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('submits a rating optimistically and advances to the next card', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [CARD_1, CARD_2] } }, true)) // GET deck
      .mockResolvedValueOnce(jsonResponse({ cards: [CARD_1, CARD_2] }, true)) // GET due cards
      .mockResolvedValueOnce(
        jsonResponse({ card: null, review: { id: 'r1', cardId: 'c1', rating: 3, duration: null, createdAt: '' } }, true),
      ) // POST review

    renderAtPath('/study?deckId=d1')

    await waitFor(() => expect(screen.getByText('Hola?')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Show Answer' }))
    await user.click(screen.getByRole('button', { name: /good/i }))

    // The rating is submitted with the id of the displayed card.
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/study/review',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ cardId: 'c1', rating: 'medium' }),
        }),
      ),
    )
    // Optimistically advanced to the next card.
    await waitFor(() => expect(screen.getByText('Adiós?')).toBeInTheDocument())
  })

  it('reverts the optimistic update and shows an error when the mutation fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [CARD_1, CARD_2] } }, true)) // GET deck
      .mockResolvedValueOnce(jsonResponse({ cards: [CARD_1, CARD_2] }, true)) // GET due cards
      .mockResolvedValueOnce(jsonResponse({ message: 'Card not found' }, false)) // POST review fails

    renderAtPath('/study?deckId=d1')

    await waitFor(() => expect(screen.getByText('Hola?')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Show Answer' }))
    await user.click(screen.getByRole('button', { name: /good/i }))

    // The failed card is restored to the front of the queue.
    await waitFor(() => expect(screen.getByText('Hola?')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent('Card not found')
  })

  it('ends the session gracefully when no more cards are due', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [CARD_1] } }, true)) // GET deck
      .mockResolvedValueOnce(jsonResponse({ cards: [CARD_1] }, true)) // GET due cards
      .mockResolvedValueOnce(
        jsonResponse({ card: null, review: { id: 'r1', cardId: 'c1', rating: 3, duration: null, createdAt: '' } }, true),
      ) // POST review returns no next card

    renderAtPath('/study?deckId=d1')

    await waitFor(() => expect(screen.getByText('Hola?')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Show Answer' }))
    await user.click(screen.getByRole('button', { name: /good/i }))

    await waitFor(() => expect(screen.getByText(/all caught up/i)).toBeInTheDocument())
    expect(screen.getByText(/reviewed 1 card/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to decks' })).toBeInTheDocument()
  })
})
