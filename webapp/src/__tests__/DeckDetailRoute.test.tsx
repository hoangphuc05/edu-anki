import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext.jsx'
import { routeTree } from '../routeTree.gen'

function jsonResponse(body: unknown, ok: boolean) {
  return {
    ok,
    json: async () => body,
  } as Response
}

const AUTHED_USER = { id: 'u1', email: 'owner@example.com' }
const DECK = { id: 'd1', title: 'Spanish Vocab', description: 'Basics', userId: 'u1', createdAt: '' }
const CARD = { id: 'c1', deckId: 'd1', question: 'Hola?', answer: 'Hello', tags: ['greeting'], createdAt: '' }

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

describe('Deck detail route', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.spyOn(window, 'confirm')
  })

  it('renders the deck title and its cards', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [CARD] } }, true)) // GET deck
      .mockResolvedValueOnce(jsonResponse({ cards: [CARD] }, true)) // GET cards

    renderAtPath('/decks/d1')

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Spanish Vocab' })).toBeInTheDocument())
    expect(screen.getByText('Hola?')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('deletes a card after confirmation', async () => {
    ;(window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true)
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [CARD] } }, true)) // GET deck
      .mockResolvedValueOnce(jsonResponse({ cards: [CARD] }, true)) // GET cards
      .mockResolvedValueOnce(jsonResponse({ message: 'Card deleted successfully' }, true)) // DELETE card
      .mockResolvedValueOnce(jsonResponse({ deck: { ...DECK, cards: [] } }, true)) // refetch deck
      .mockResolvedValueOnce(jsonResponse({ cards: [] }, true)) // refetch cards

    renderAtPath('/decks/d1')

    await waitFor(() => expect(screen.getByText('Hola?')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /delete$/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/cards/c1', expect.objectContaining({ method: 'DELETE' })),
    )
  })
})
