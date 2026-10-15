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
  type Car,
  type Credentials,
  type RegisterPayload,
  type ResetPasswordPayload,
  type RidePayload,
  type Review,
  type ReviewPayload,
  type Session,
  type TripSearchParams,
  type TripWithDriver,
  type TripWithPassengers,
  type UpdateProfilePayload,
  type User,
  type UserProfile,
  type SustainabilityImpact,
} from '@/types'
import { API_BASE_URL } from '@/utils/apiUrl'
import type { Api } from './api'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  // FormData sets its own multipart Content-Type with the boundary
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${path}`, {
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

    requestPasswordReset: (email: string) =>
      request<void>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

    checkResetToken: (token: string) =>
      request<void>(`/auth/reset-password?token=${encodeURIComponent(token)}`),

    resetPassword: (payload: ResetPasswordPayload) =>
      request<void>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),

    listSessions: async () =>
      (await request<{ sessions: Session[] }>('/auth/me/sessions')).sessions,

    deleteSession: (sessionId: string) =>
      request<void>(`/auth/me/sessions/${sessionId}`, { method: 'DELETE' }),

    setCar: async (carId: string | null) =>
      (
        await request<{ user: User }>('/auth/me/car', {
          method: 'PUT',
          body: JSON.stringify({ carId }),
        })
      ).user,

    uploadProfilePicture: async (file: File) => {
      const body = new FormData()
      body.append('picture', file)
      return (await request<{ user: User }>('/auth/me/picture', { method: 'PUT', body })).user
    },

    deleteProfilePicture: async () =>
      (await request<{ user: User }>('/auth/me/picture', { method: 'DELETE' })).user,
  },

  trips: {
    search: (params: TripSearchParams) => {
      const query = new URLSearchParams({
        ...(params.originCity ? { origin: params.originCity } : {}),
        ...(params.destinationCity ? { destination: params.destinationCity } : {}),
        ...(params.departureDate ? { date: params.departureDate } : {}),
        ...(params.departureTime ? { time: params.departureTime } : {}),
      })
      const qs = query.toString()
      return request<TripWithDriver[]>(`/api/trips${qs ? `?${qs}` : ''}`)
    },

    listMine: async () => (await request<{ rides: TripWithPassengers[] }>('/api/rides/mine')).rides,

    create: async (payload: RidePayload) =>
      (
        await request<{ ride: TripWithPassengers }>('/api/rides', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      ).ride,

    update: async (tripId: string, payload: RidePayload) =>
      (
        await request<{ ride: TripWithPassengers }>(`/api/rides/${tripId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      ).ride,

    remove: (tripId: string) => request<void>(`/api/rides/${tripId}`, { method: 'DELETE' }),
  },

  bookings: {
    listMine: () => request<BookingWithTrip[]>('/api/bookings/mine'),

    create: (tripId: string, payload: BookingPayload) =>
      request<Booking>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ tripId, ...payload }),
      }),

    update: (bookingId: string, payload: BookingPayload) =>
      request<Booking>(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    cancel: (bookingId: string) =>
      request<void>(`/api/bookings/${bookingId}`, { method: 'DELETE' }),
  },

  reviews: {
    create: (payload: ReviewPayload) =>
      request<Review>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  users: {
    get: (userId: string) => request<UserProfile>(`/api/users/${userId}`),
  },

  cars: {
    list: async () => (await request<{ cars: Car[] }>('/api/cars')).cars,
  },
  impact: {
    get: async () => {
      const res = await request<SustainabilityImpact & { impact?: SustainabilityImpact }>(
        '/api/impact',
      )
      return res.impact ?? res
    },
  },
}
