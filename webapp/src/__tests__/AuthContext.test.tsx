import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';

function jsonResponse(body: unknown, ok: boolean) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('AuthContext', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('starts loading, then has no user when there is no valid refresh session', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ message: 'Missing refresh token' }, false),
    );

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('login sets the user and access token on success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({}, false)) // initial silent refresh attempt
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: '1', email: 'a@example.com' }, accessToken: 'token123' }, true),
      );

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('a@example.com', 'password123');
    });

    expect(result.current.user?.email).toBe('a@example.com');
    expect(result.current.accessToken).toBe('token123');
  });

  it('login rejects and does not set a user when credentials are invalid', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({}, false)) // initial silent refresh attempt
      .mockResolvedValueOnce(
        jsonResponse({ error: 'AuthenticationError', message: 'Invalid email or password' }, false),
      );

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('a@example.com', 'wrong-password');
      }),
    ).rejects.toThrow(/invalid email or password/i);

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('logout clears the user and access token', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({}, false)) // initial silent refresh attempt
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: '1', email: 'a@example.com' }, accessToken: 'token123' }, true),
      )
      .mockResolvedValueOnce(jsonResponse({ message: 'Logged out successfully' }, true));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('a@example.com', 'password123');
    });
    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });
});
