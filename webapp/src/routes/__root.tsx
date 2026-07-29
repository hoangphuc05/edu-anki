import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useAuth } from '../context/AuthContext.jsx'

const RootLayout = () => {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <>
      <div className="navbar bg-base-200 px-4">
        <div className="flex-1 flex gap-4">
          <Link to="/" className="[&.active]:font-bold">
            Home
          </Link>
          <Link to="/about" className="[&.active]:font-bold">
            About
          </Link>
        </div>
        <div className="flex-none flex items-center gap-2">
          {isLoading ? null : user ? (
            <>
              <span className="text-sm opacity-70">{user.email}</span>
              <button type="button" className="btn btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })