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
    <div className="p-4 max-w-sm mx-auto">
      <h3 className="text-lg font-bold mb-4">Log in</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="form-control">
          <span className="label-text">Email</span>
          <input
            type="email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="form-control">
          <span className="label-text">Password</span>
          <input
            type="password"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="link">
          Register
        </Link>
      </p>
    </div>
  )
}
