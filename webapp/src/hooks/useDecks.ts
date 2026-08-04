import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import * as decksApi from '../api/decks'
import type { CardInput, DeckInput } from '../api/decks'

export function useDecksQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['decks'],
    queryFn: () => decksApi.getDecks(accessToken),
    enabled: Boolean(accessToken),
  })
}

export function useDeckQuery(deckId: string) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['decks', deckId],
    queryFn: () => decksApi.getDeck(deckId, accessToken),
    enabled: Boolean(accessToken) && Boolean(deckId),
  })
}

export function useCreateDeckMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeckInput) => decksApi.createDeck(data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}

export function useUpdateDeckMutation(deckId: string) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeckInput) => decksApi.updateDeck(deckId, data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] })
      queryClient.invalidateQueries({ queryKey: ['decks', deckId] })
    },
  })
}

export function useDeleteDeckMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deckId: string) => decksApi.deleteDeck(deckId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}

export function useCardsQuery(deckId: string) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['decks', deckId, 'cards'],
    queryFn: () => decksApi.getCards(deckId, accessToken),
    enabled: Boolean(accessToken) && Boolean(deckId),
  })
}

export function useCreateCardMutation(deckId: string) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CardInput) => decksApi.createCard(deckId, data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks', deckId] })
    },
  })
}

export function useUpdateCardMutation(deckId: string) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CardInput }) =>
      decksApi.updateCard(cardId, data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks', deckId] })
    },
  })
}

export function useDeleteCardMutation(deckId: string) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => decksApi.deleteCard(cardId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks', deckId] })
    },
  })
}
