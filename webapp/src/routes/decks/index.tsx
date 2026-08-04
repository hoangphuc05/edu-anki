import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { deckCreateSchema } from 'shared-types'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCreateDeckMutation, useDecksQuery, useDeleteDeckMutation } from '../../hooks/useDecks'

export const Route = createFileRoute('/decks/')({
  component: DecksPage,
})

function DecksPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login' })
    }
  }, [isLoading, user, navigate])

  const decksQuery = useDecksQuery()
  const createDeckMutation = useCreateDeckMutation()
  const deleteDeckMutation = useDeleteDeckMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = deckCreateSchema.safeParse({
      title,
      description: description.trim() === '' ? undefined : description,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    try {
      await createDeckMutation.mutateAsync(parsed.data)
      setTitle('')
      setDescription('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create deck')
    }
  }

  async function handleDelete(deckId: string) {
    if (!window.confirm('Delete this deck and all of its cards?')) {
      return
    }
    await deleteDeckMutation.mutateAsync(deckId)
  }

  if (isLoading || !user) {
    return null
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Your decks</h1>
        <p className="mt-2 text-sm text-slate-600">Create a new deck to start adding cards.</p>
        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>Title</span>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>Description (optional)</span>
            <textarea
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {formError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={createDeckMutation.isPending}
          >
            {createDeckMutation.isPending ? 'Creating…' : 'Create deck'}
          </button>
        </form>
      </section>

      <section className="mx-auto w-full max-w-2xl">
        {decksQuery.isLoading && <p className="text-sm text-slate-600">Loading decks…</p>}
        {decksQuery.isError && (
          <p role="alert" className="text-sm text-red-700">
            {decksQuery.error instanceof Error ? decksQuery.error.message : 'Failed to load decks'}
          </p>
        )}
        {decksQuery.data && decksQuery.data.decks.length === 0 && (
          <p className="text-sm text-slate-600">No decks yet. Create your first one above.</p>
        )}
        {decksQuery.data && decksQuery.data.decks.length > 0 && (
          <ul className="flex flex-col gap-3">
            {decksQuery.data.decks.map((deck) => (
              <li
                key={deck.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Link to="/decks/$deckId" params={{ deckId: deck.id }} className="flex-1">
                  <p className="font-medium text-slate-900">{deck.title}</p>
                  {deck.description && <p className="text-sm text-slate-600">{deck.description}</p>}
                </Link>
                <button
                  type="button"
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                  onClick={() => handleDelete(deck.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
