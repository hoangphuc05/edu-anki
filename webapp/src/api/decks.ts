import { apiFetch } from './client'

export interface Deck {
  id: string
  title: string
  description: string | null
  userId: string
  createdAt: string
}

export interface Card {
  id: string
  deckId: string
  question: string
  answer: string
  tags: string[]
  createdAt: string
}

export interface DeckWithCards extends Deck {
  cards: Card[]
}

export interface DeckInput {
  title?: string
  description?: string | null
}

export interface CardInput {
  question?: string
  answer?: string
  tags?: string[]
}

export function getDecks(token: string | null) {
  return apiFetch<{ decks: Deck[] }>('/api/decks', { token })
}

export function getDeck(deckId: string, token: string | null) {
  return apiFetch<{ deck: DeckWithCards }>(`/api/decks/${deckId}`, { token })
}

export function createDeck(data: DeckInput, token: string | null) {
  return apiFetch<{ deck: Deck }>('/api/decks', { method: 'POST', body: data, token })
}

export function updateDeck(deckId: string, data: DeckInput, token: string | null) {
  return apiFetch<{ deck: Deck }>(`/api/decks/${deckId}`, { method: 'PUT', body: data, token })
}

export function deleteDeck(deckId: string, token: string | null) {
  return apiFetch<{ message: string }>(`/api/decks/${deckId}`, { method: 'DELETE', token })
}

export function getCards(deckId: string, token: string | null) {
  return apiFetch<{ cards: Card[] }>(`/api/decks/${deckId}/cards`, { token })
}

export function createCard(deckId: string, data: CardInput, token: string | null) {
  return apiFetch<{ card: Card }>(`/api/decks/${deckId}/cards`, { method: 'POST', body: data, token })
}

export function updateCard(cardId: string, data: CardInput, token: string | null) {
  return apiFetch<{ card: Card }>(`/api/cards/${cardId}`, { method: 'PUT', body: data, token })
}

export function deleteCard(cardId: string, token: string | null) {
  return apiFetch<{ message: string }>(`/api/cards/${cardId}`, { method: 'DELETE', token })
}
