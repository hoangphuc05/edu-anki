import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { registerSchema } from 'shared-types'
import { useAuth } from '../context/AuthContext.jsx'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const parsed = registerSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setIsSubmitting(true)
    try {
      await register(parsed.data.email, parsed.data.password)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h3 className="text-lg font-bold mb-4">Create an account</h3>
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
            autoComplete="new-password"
            required
          />
        </label>
        <label className="form-control">
          <span className="label-text">Confirm password</span>
          <input
            type="password"
            className="input input-bordered w-full"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="link">
          Log in
        </Link>
      </p>
    </div>
  )
}
