/**
 * Client for the Go backend in ../shotgun-api. Auth is the HttpOnly `session` cookie the
 * backend sets, so every request sends `credentials: 'include'` and no token is handled here.
 */
import {
  ApiError,
  type Booking,
  type ChangePasswordPayload,
  type BookingPayload,
  type BookingWithTrip,
  type Credentials,
  type RegisterPayload,
  type RidePayload,
  type Trip,
  type TripSearchParams,
  type TripWithDriver,
  type UpdateProfilePayload,
  type User,
} from '@/types'
import type { Api } from './api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/password') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.message ?? response.statusText, response.status)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

export const httpApi: Api = {
  auth: {
    login: async (credentials: Credentials) =>
      (
        await request<{ user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      ).user,

    register: async (payload: RegisterPayload) =>
      (
        await request<{ user: User }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      ).user,

    logout: () => request<void>('/auth/logout', { method: 'POST' }),

    me: async () => (await request<{ user: User }>('/auth/me')).user,

    updateProfile: async (payload: UpdateProfilePayload) =>
      (
        await request<{ user: User }>('/auth/me', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      ).user,

    changePassword: (payload: ChangePasswordPayload) =>
      request<void>('/auth/password', { method: 'POST', body: JSON.stringify(payload) }),

    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),
  },

  trips: {
    search: (params: TripSearchParams) => {
      const query = new URLSearchParams({
        ...(params?.originCity ? { origin: params.originCity } : {}),
        ...(params?.destinationCity ? { destination: params.destinationCity } : {}),
        ...(params?.departureDate ? { date: params.departureDate } : {}),
        ...(params?.departureTime ? { time: params.departureTime } : {}),
      })
      const qs = query.toString()
      return request<TripWithDriver[]>(`/trips${qs ? `?${qs}` : ''}`)
    },

    listMine: async () => (await request<{ rides: Trip[] }>('/api/rides/mine')).rides,

    create: async (payload: RidePayload) =>
      (
        await request<{ ride: Trip }>('/api/rides', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      ).ride,

    update: async (tripId: string, payload: RidePayload) =>
      (
        await request<{ ride: Trip }>(`/api/rides/${tripId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      ).ride,

    remove: (tripId: string) => request<void>(`/api/rides/${tripId}`, { method: 'DELETE' }),
  },

  bookings: {
    listMine: () => request<BookingWithTrip[]>('/bookings/mine'),

    create: (tripId: string, payload: BookingPayload) =>
      request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify({ tripId, ...payload }),
      }),

    update: (bookingId: string, payload: BookingPayload) =>
      request<Booking>(`/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    cancel: (bookingId: string) => request<void>(`/bookings/${bookingId}`, { method: 'DELETE' }),
  },
}
