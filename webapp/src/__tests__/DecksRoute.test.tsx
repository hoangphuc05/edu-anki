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

describe('Decks list route', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.spyOn(window, 'confirm')
  })

  it('renders the decks returned by the API for an authenticated user', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(
        jsonResponse({ decks: [{ id: 'd1', title: 'Spanish Vocab', description: 'Basics', userId: 'u1', createdAt: '' }] }, true),
      ) // GET /api/decks

    renderAtPath('/decks')

    await waitFor(() => expect(screen.getByText('Spanish Vocab')).toBeInTheDocument())
    expect(screen.getByText('Basics')).toBeInTheDocument()
  })

  it('shows a validation error and does not submit when the title is empty', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(jsonResponse({ decks: [] }, true)) // GET /api/decks

    renderAtPath('/decks')

    await waitFor(() => expect(screen.getByText(/no decks yet/i)).toBeInTheDocument())

    const user = userEvent.setup()
    const fetchCallsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length
    // A whitespace-only title passes the native "required" attribute but
    // fails the shared Zod schema's trim().min(1) check client-side.
    await user.type(screen.getByLabelText(/title/i), '   ')
    await user.click(screen.getByRole('button', { name: /create deck/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/title is required/i)
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(fetchCallsBefore)
  })

  it('deletes a deck after confirmation', async () => {
    ;(window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true)
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ user: AUTHED_USER, accessToken: 'token123' }, true)) // silent refresh
      .mockResolvedValueOnce(
        jsonResponse({ decks: [{ id: 'd1', title: 'Spanish Vocab', description: null, userId: 'u1', createdAt: '' }] }, true),
      ) // GET /api/decks
      .mockResolvedValueOnce(jsonResponse({ message: 'Deck deleted successfully' }, true)) // DELETE
      .mockResolvedValueOnce(jsonResponse({ decks: [] }, true)) // refetch after invalidation

    renderAtPath('/decks')

    await waitFor(() => expect(screen.getByText('Spanish Vocab')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/decks/d1', expect.objectContaining({ method: 'DELETE' })),
    )
  })
})
