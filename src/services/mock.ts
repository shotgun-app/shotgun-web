/**
 * In-memory implementation of `Api`, backed by `src/mock/data.ts`.
 *
 * It fakes network latency and token handling so the UI exercises the same
 * loading/error paths it will hit against the real Go backend.
 */
import {
  ApiError,
  type Credentials,
  type RegisterPayload,
  type Session,
  type TripSearchParams,
  type TripWithDriver,
  type UpdateProfilePayload,
  type User,
} from '@/types'
import { MOCK_ACCOUNTS, MOCK_TRIPS, type MockAccount } from '@/mock/data'
import type { Api } from './api'

const LATENCY_MS = 350

const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms))

/** Copy of the seed data, so a registration in one session does not leak into the next reload. */
const accounts: MockAccount[] = MOCK_ACCOUNTS.map((a) => ({ ...a, user: { ...a.user } }))

/** token -> userId. Stands in for the backend's session/JWT store. */
const sessions = new Map<string, string>()

function issueToken(user: User): string {
  const token = `mock.${user.id}.${Date.now().toString(36)}`
  sessions.set(token, user.id)
  return token
}

function findByEmail(email: string): MockAccount | undefined {
  return accounts.find((a) => a.user.email.toLowerCase() === email.trim().toLowerCase())
}

export const mockApi: Api = {
  auth: {
    async login({ email, password }: Credentials): Promise<Session> {
      await delay()
      const account = findByEmail(email)
      if (!account || account.password !== password) {
        throw new ApiError('Wrong email or password.', 401)
      }
      return { token: issueToken(account.user), user: { ...account.user } }
    },

    async register({ email, password, name }: RegisterPayload): Promise<Session> {
      await delay()
      if (findByEmail(email)) {
        throw new ApiError('An account with that email already exists.', 409)
      }
      const user: User = {
        id: `usr_${accounts.length + 1}`,
        email: email.trim(),
        name: name.trim(),
        avatarUrl: null,
        phone: null,
        joinedAt: new Date().toISOString(),
        rating: 0,
        ratingCount: 0,
        co2SavedKg: 0,
      }
      accounts.push({ password, user })
      return { token: issueToken(user), user: { ...user } }
    },

    async logout(token: string): Promise<void> {
      await delay(120)
      sessions.delete(token)
    },

    async me(token: string): Promise<User> {
      await delay(120)
      // After a page reload the in-memory session map is empty, so fall back to
      // the user id encoded in the token. The real backend just validates the JWT.
      const userId = sessions.get(token) ?? token.split('.')[1]
      const account = userId && accounts.find((a) => a.user.id === userId)
      if (!account) {
        throw new ApiError('Session expired.', 401)
      }
      return { ...account.user }
    },

    async updateProfile(token: string, payload: UpdateProfilePayload): Promise<User> {
      await delay()
      const userId = sessions.get(token) ?? token.split('.')[1]
      const account = userId && accounts.find((a) => a.user.id === userId)
      if (!account) {
        throw new ApiError('Session expired.', 401)
      }
      // Guard against taking another user's email.
      const conflict = accounts.find(
        (a) => a.user.email.toLowerCase() === payload.email.trim().toLowerCase() &&
               a.user.id !== account.user.id,
      )
      if (conflict) {
        throw new ApiError('An account with that email already exists.', 409)
      }
      account.user.name = payload.name.trim()
      account.user.email = payload.email.trim()
      return { ...account.user }
    },

    async deleteAccount(token: string): Promise<void> {
      await delay()
      const userId = sessions.get(token) ?? token.split('.')[1]
      const index = userId ? accounts.findIndex((a) => a.user.id === userId) : -1
      if (index === -1) {
        throw new ApiError('Session expired.', 401)
      }
      // Remove all active sessions for this user, then delete the account.
      for (const [t, uid] of sessions.entries()) {
        if (uid === userId) sessions.delete(t)
      }
      accounts.splice(index, 1)
    },
  },

  trips: {
    async search(params: TripSearchParams): Promise<TripWithDriver[]> {
      await delay()

      const origin = params.originCity.trim().toLowerCase()
      const destination = params.destinationCity.trim().toLowerCase()

      const matching = MOCK_TRIPS.filter((trip) => {
        const matchesOrigin = trip.origin.toLowerCase() === origin
        const matchesDestination = trip.destination.toLowerCase() === destination
        if (!matchesOrigin || !matchesDestination) return false

        if (params.departureDate) {
          return trip.departureAt.startsWith(params.departureDate)
        }
        return true
      })

      return matching.map((trip) => {
        const account = accounts.find((a) => a.user.id === trip.driverId)
        const driver: User = account
          ? { ...account.user }
          : {
              id: trip.driverId,
              email: 'driver@shotgun.app',
              name: 'Driver',
              avatarUrl: null,
              phone: null,
              joinedAt: '2026-01-01T00:00:00Z',
              rating: 5.0,
              ratingCount: 1,
              co2SavedKg: 50,
            }

        return {
          ...trip,
          driver,
        }
      })
    },
  },
}
