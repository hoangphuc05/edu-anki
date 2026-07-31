import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Study smarter</p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Welcome Home!</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
        Build a steady review habit and keep the material that matters close at hand.
      </p>
    </div>
  )
}