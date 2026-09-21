/**
 * Real implementation against the Go backend in ../shotgun-api.
 *
 * Unused while `USE_MOCK_API` is true - it exists so plugging the backend in is
 * a config flip plus filling in whatever the final endpoints turn out to be.
 */
import { ApiError, type Credentials, type RegisterPayload, type Session, type User } from '@/types'
import type { Api } from './api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.message ?? response.statusText, response.status)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

export const httpApi: Api = {
  auth: {
    login: (credentials: Credentials) =>
      request<Session>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

    register: (payload: RegisterPayload) =>
      request<Session>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

    logout: (token: string) => request<void>('/auth/logout', { method: 'POST' }, token),

    me: (token: string) => request<User>('/auth/me', {}, token),
  },
}
