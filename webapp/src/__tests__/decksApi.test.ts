import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch } from '../api/client'
import * as decksApi from '../api/decks'

function jsonResponse(body: unknown, ok: boolean) {
  return {
    ok,
    json: async () => body,
  } as Response
}

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('sends a GET request with the Authorization header when a token is provided', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ ok: true }, true))

    await apiFetch('/api/decks', { token: 'abc123' })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/decks',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      }),
    )
  })

  it('JSON-encodes the body and sets Content-Type when a body is provided', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ ok: true }, true))

    await apiFetch('/api/decks', { method: 'POST', body: { title: 'Deck' }, token: 'abc123' })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/decks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Deck' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json', Authorization: 'Bearer abc123' }),
      }),
    )
  })

  it('throws a descriptive error for a non-ok response', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ error: 'NotFoundError', message: 'Deck not found' }, false),
    )

    await expect(apiFetch('/api/decks/missing', { token: 'abc123' })).rejects.toThrow('Deck not found')
  })
})

describe('decks API functions', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('getDecks calls GET /api/decks', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ decks: [] }, true))

    const result = await decksApi.getDecks('token')

    expect(global.fetch).toHaveBeenCalledWith('/api/decks', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual({ decks: [] })
  })

  it('createCard posts to the nested cards endpoint', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ card: { id: '1', deckId: 'd1', question: 'Q', answer: 'A', tags: [] } }, true),
    )

    await decksApi.createCard('d1', { question: 'Q', answer: 'A' }, 'token')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/decks/d1/cards',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ question: 'Q', answer: 'A' }) }),
    )
  })

  it('deleteDeck calls DELETE on the deck resource', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ message: 'Deck deleted successfully' }, true))

    await decksApi.deleteDeck('d1', 'token')

    expect(global.fetch).toHaveBeenCalledWith('/api/decks/d1', expect.objectContaining({ method: 'DELETE' }))
  })
})
