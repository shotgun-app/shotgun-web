/**
 * Real implementation against the Go backend in ../shotgun-api.
 *
 * Unused while `USE_MOCK_API` is true - it exists so plugging the backend in is
 * a config flip plus filling in whatever the final endpoints turn out to be.
 */
import {
  ApiError,
  type Credentials,
  type RegisterPayload,
  type RidePayload,
  type Session,
  type Trip,
  type TripSearchParams,
  type TripWithDriver,
  type UpdateProfilePayload,
  type User,
} from '@/types'
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

    updateProfile: (token: string, payload: UpdateProfilePayload) =>
      request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }, token),

    deleteAccount: (token: string) => request<void>('/auth/me', { method: 'DELETE' }, token),
  },

  trips: {
    search: (params: TripSearchParams) => {
      const query = new URLSearchParams({
        origin: params.originCity,
        destination: params.destinationCity,
        ...(params.departureDate ? { date: params.departureDate } : {}),
      })
      return request<TripWithDriver[]>(`/trips?${query.toString()}`)
    },

    listMine: (token: string) => request<Trip[]>('/rides/mine', {}, token),

    create: (token: string, payload: RidePayload) =>
      request<Trip>('/rides', { method: 'POST', body: JSON.stringify(payload) }, token),

    update: (token: string, tripId: string, payload: RidePayload) =>
      request<Trip>(`/rides/${tripId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token),

    remove: (token: string, tripId: string) =>
      request<void>(`/rides/${tripId}`, { method: 'DELETE' }, token),
  },
}
