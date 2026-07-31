import { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = '/api/auth';

/**
 * @typedef {{ id: string, email: string }} AuthUser
 */

/**
 * @typedef {object} AuthContextValue
 * @property {AuthUser | null} user
 * @property {string | null} accessToken
 * @property {boolean} isLoading
 * @property {(email: string, password: string) => Promise<void>} login
 * @property {(email: string, password: string) => Promise<void>} register
 * @property {() => Promise<void>} logout
 */

/** @type {import('react').Context<AuthContextValue | undefined>} */
const AuthContext = createContext(undefined);

/**
 * Parse a fetch Response as JSON and throw a descriptive Error if the
 * response was not successful (so callers can surface it in the UI).
 * @param {Response} response
 */
async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, attempt to silently restore a session using the httpOnly
  // refresh cookie (if present) rather than persisting the access token
  // itself in localStorage.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const refreshRes = await fetch(`${API_BASE}/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        const data = await parseJsonResponse(refreshRes);
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // No valid session to restore; user stays logged out.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function register(email, password) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  const value = { user, accessToken, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
