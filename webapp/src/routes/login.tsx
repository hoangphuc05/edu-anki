import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { loginSchema } from 'shared-types'
import { useAuth } from '../context/AuthContext.jsx'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setIsSubmitting(true)
    try {
      await login(parsed.data.email, parsed.data.password)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Log in</h1>
      <p className="mt-2 text-sm text-slate-600">Continue your study session.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>Email</span>
          <input
            type="email"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>Password</span>
          <input
            type="password"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600">
          Register
        </Link>
      </p>
    </section>
  )
}
