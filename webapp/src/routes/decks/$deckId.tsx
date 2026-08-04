import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { cardCreateSchema, cardUpdateSchema, deckUpdateSchema } from 'shared-types'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  useCardsQuery,
  useCreateCardMutation,
  useDeckQuery,
  useDeleteCardMutation,
  useDeleteDeckMutation,
  useUpdateCardMutation,
  useUpdateDeckMutation,
} from '../../hooks/useDecks'
import type { Card } from '../../api/decks'

export const Route = createFileRoute('/decks/$deckId')({
  component: DeckDetailPage,
})

function parseTagsInput(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

function DeckDetailPage() {
  const { deckId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login' })
    }
  }, [isLoading, user, navigate])

  const deckQuery = useDeckQuery(deckId)
  const cardsQuery = useCardsQuery(deckId)
  const updateDeckMutation = useUpdateDeckMutation(deckId)
  const deleteDeckMutation = useDeleteDeckMutation()
  const createCardMutation = useCreateCardMutation(deckId)
  const updateCardMutation = useUpdateCardMutation(deckId)
  const deleteCardMutation = useDeleteCardMutation(deckId)

  const [isEditingDeck, setIsEditingDeck] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deckError, setDeckError] = useState<string | null>(null)

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [cardError, setCardError] = useState<string | null>(null)

  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editCardError, setEditCardError] = useState<string | null>(null)

  function startEditDeck() {
    if (!deckQuery.data) return
    setTitle(deckQuery.data.deck.title)
    setDescription(deckQuery.data.deck.description ?? '')
    setDeckError(null)
    setIsEditingDeck(true)
  }

  async function handleUpdateDeck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeckError(null)

    const parsed = deckUpdateSchema.safeParse({
      title,
      description: description.trim() === '' ? undefined : description,
    })
    if (!parsed.success) {
      setDeckError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    try {
      await updateDeckMutation.mutateAsync(parsed.data)
      setIsEditingDeck(false)
    } catch (err) {
      setDeckError(err instanceof Error ? err.message : 'Failed to update deck')
    }
  }

  async function handleDeleteDeck() {
    if (!window.confirm('Delete this deck and all of its cards?')) {
      return
    }
    await deleteDeckMutation.mutateAsync(deckId)
    navigate({ to: '/decks' })
  }

  async function handleCreateCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCardError(null)

    const parsed = cardCreateSchema.safeParse({
      question,
      answer,
      tags: parseTagsInput(tagsInput),
    })
    if (!parsed.success) {
      setCardError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    try {
      await createCardMutation.mutateAsync(parsed.data)
      setQuestion('')
      setAnswer('')
      setTagsInput('')
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Failed to create card')
    }
  }

  function startEditCard(card: Card) {
    setEditingCardId(card.id)
    setEditQuestion(card.question)
    setEditAnswer(card.answer)
    setEditTags(card.tags.join(', '))
    setEditCardError(null)
  }

  async function handleUpdateCard(event: React.FormEvent<HTMLFormElement>, cardId: string) {
    event.preventDefault()
    setEditCardError(null)

    const parsed = cardUpdateSchema.safeParse({
      question: editQuestion,
      answer: editAnswer,
      tags: parseTagsInput(editTags),
    })
    if (!parsed.success) {
      setEditCardError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    try {
      await updateCardMutation.mutateAsync({ cardId, data: parsed.data })
      setEditingCardId(null)
    } catch (err) {
      setEditCardError(err instanceof Error ? err.message : 'Failed to update card')
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!window.confirm('Delete this card?')) {
      return
    }
    await deleteCardMutation.mutateAsync(cardId)
  }

  if (isLoading || !user) {
    return null
  }

  if (deckQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading deck…</p>
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {deckQuery.error instanceof Error ? deckQuery.error.message : 'Deck not found'}
      </p>
    )
  }

  const deck = deckQuery.data.deck
  const cards = cardsQuery.data?.cards ?? []

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {!isEditingDeck ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{deck.title}</h1>
                {deck.description && <p className="mt-2 text-sm text-slate-600">{deck.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  onClick={startEditDeck}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                  onClick={handleDeleteDeck}
                >
                  Delete deck
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdateDeck} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Title</span>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Description</span>
              <textarea
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            {deckError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {deckError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={updateDeckMutation.isPending}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                onClick={() => setIsEditingDeck(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">Add a card</h2>
        <form onSubmit={handleCreateCard} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>Question</span>
            <textarea
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>Answer</span>
            <textarea
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>Tags (comma-separated)</span>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="easy, verbs"
            />
          </label>
          {cardError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {cardError}
            </p>
          )}
          <button
            type="submit"
            className="self-start rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={createCardMutation.isPending}
          >
            {createCardMutation.isPending ? 'Adding…' : 'Add card'}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        {cardsQuery.isLoading && <p className="text-sm text-slate-600">Loading cards…</p>}
        {cards.length === 0 && !cardsQuery.isLoading && (
          <p className="text-sm text-slate-600">No cards yet. Add your first one above.</p>
        )}
        {cards.map((card) => (
          <div key={card.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {editingCardId !== card.id ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{card.question}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.answer}</p>
                  {card.tags.length > 0 && (
                    <p className="mt-2 text-xs text-slate-500">{card.tags.join(', ')}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={() => startEditCard(card)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => handleUpdateCard(e, card.id)} className="flex flex-col gap-3">
                <textarea
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  required
                />
                <textarea
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="tags, comma-separated"
                />
                {editCardError && (
                  <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {editCardError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={() => setEditingCardId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
