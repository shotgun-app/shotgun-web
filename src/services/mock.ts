/**
 * In-memory implementation of `Api`, backed by `src/mock/data.ts`.
 *
 * It fakes network latency and token handling so the UI exercises the same
 * loading/error paths it will hit against the real Go backend.
 */
import {
  ApiError,
  type Booking,
  type BookingPayload,
  type BookingWithTrip,
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
import { MOCK_ACCOUNTS, MOCK_BOOKINGS, MOCK_TRIPS, type MockAccount } from '@/mock/data'
import type { Api } from './api'

const LATENCY_MS = 350

const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms))

/** Copy of the seed data, so a registration in one session does not leak into the next reload. */
const accounts: MockAccount[] = MOCK_ACCOUNTS.map((a) => ({ ...a, user: { ...a.user } }))

/** Mutable in-memory bookings list (deep copy of seed data). */
const bookings: Booking[] = MOCK_BOOKINGS.map((b) => ({ ...b }))

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

/** Resolves the userId a token stands for. Falls back to the id encoded in the
 * token itself, since a page reload clears the in-memory session map. */
function resolveUserId(token: string): string | undefined {
  return sessions.get(token) ?? token.split('.')[1]
}

function requireAccount(token: string): MockAccount {
  const userId = resolveUserId(token)
  const account = userId && accounts.find((a) => a.user.id === userId)
  if (!account) {
    throw new ApiError('Session expired.', 401)
  }
  return account
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

const MAX_SEATS = 15

function assertValidRide(payload: RidePayload, minSeats: number): void {
  if (!payload.origin.trim() || !payload.destination.trim() || !payload.departureAt) {
    throw new ApiError('Start, end and date are required.', 400)
  }
  if (!Number.isInteger(payload.seatsTotal) || payload.seatsTotal < minSeats) {
    throw new ApiError(
      minSeats > 1
        ? `Free seats can't be less than the ${minSeats} already booked.`
        : 'Free seats must be at least 1.',
      400,
    )
  }
  if (payload.seatsTotal > MAX_SEATS) {
    throw new ApiError(`Free seats can't be more than ${MAX_SEATS}.`, 400)
  }
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
      const account = requireAccount(token)
      return { ...account.user }
    },

    async updateProfile(token: string, payload: UpdateProfilePayload): Promise<User> {
      await delay()
      const account = requireAccount(token)
      // Guard against taking another user's email.
      const conflict = accounts.find(
        (a) =>
          a.user.email.toLowerCase() === payload.email.trim().toLowerCase() &&
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
      const account = requireAccount(token)
      const userId = account.user.id
      const index = accounts.findIndex((a) => a.user.id === userId)
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

        if (params.departureDate && !trip.departureAt.startsWith(params.departureDate)) {
          return false
        }
        if (params.departureTime && trip.departureAt.slice(11, 16) !== params.departureTime) {
          return false
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

    async listMine(token: string): Promise<Trip[]> {
      await delay()
      const account = requireAccount(token)
      return MOCK_TRIPS.filter((trip) => trip.driverId === account.user.id)
        .slice()
        .sort((a, b) => a.departureAt.localeCompare(b.departureAt))
    },

    async create(token: string, payload: RidePayload): Promise<Trip> {
      await delay()
      const account = requireAccount(token)
      assertValidRide(payload, 1)

      const trip: Trip = {
        id: nextId('trip'),
        driverId: account.user.id,
        origin: payload.origin.trim(),
        destination: payload.destination.trim(),
        departureAt: payload.departureAt,
        seatsTotal: payload.seatsTotal,
        seatsBooked: 0,
        pricePerSeat: 0,
        currency: 'EUR',
        notes: '',
      }
      MOCK_TRIPS.push(trip)
      return { ...trip }
    },

    async update(token: string, tripId: string, payload: RidePayload): Promise<Trip> {
      await delay()
      const account = requireAccount(token)
      const trip = MOCK_TRIPS.find((t) => t.id === tripId && t.driverId === account.user.id)
      if (!trip) {
        throw new ApiError('Ride not found.', 404)
      }
      assertValidRide(payload, Math.max(1, trip.seatsBooked))

      trip.origin = payload.origin.trim()
      trip.destination = payload.destination.trim()
      trip.departureAt = payload.departureAt
      trip.seatsTotal = payload.seatsTotal
      return { ...trip }
    },

    async remove(token: string, tripId: string): Promise<void> {
      await delay()
      const account = requireAccount(token)
      const index = MOCK_TRIPS.findIndex((t) => t.id === tripId && t.driverId === account.user.id)
      if (index === -1) {
        throw new ApiError('Ride not found.', 404)
      }
      MOCK_TRIPS.splice(index, 1)
      // Bookings only ever reference a trip, so clean them up alongside it.
      for (let i = bookings.length - 1; i >= 0; i--) {
        if (bookings[i]!.tripId === tripId) bookings.splice(i, 1)
      }
    },
  },

  bookings: {
    async listMine(token: string): Promise<BookingWithTrip[]> {
      await delay()
      const account = requireAccount(token)
      const userId = account.user.id
      return bookings
        .filter((b) => b.passengerId === userId && b.status === 'confirmed')
        .sort((a, b) => {
          const tripA = MOCK_TRIPS.find((t) => t.id === a.tripId)
          const tripB = MOCK_TRIPS.find((t) => t.id === b.tripId)
          return (tripA?.departureAt ?? '').localeCompare(tripB?.departureAt ?? '')
        })
        .map((b) => {
          const trip = MOCK_TRIPS.find((t) => t.id === b.tripId)
          if (!trip) throw new ApiError('Trip not found.', 404)
          return { ...b, trip: { ...trip } }
        })
    },

    async create(token: string, tripId: string, payload: BookingPayload): Promise<Booking> {
      await delay()
      const account = requireAccount(token)
      const trip = MOCK_TRIPS.find((t) => t.id === tripId)
      if (!trip) throw new ApiError('Trip not found.', 404)
      if (!Number.isInteger(payload.seats) || payload.seats < 1) {
        throw new ApiError('You must book at least 1 seat.', 400)
      }
      const freeSeats = trip.seatsTotal - trip.seatsBooked
      if (payload.seats > freeSeats) {
        throw new ApiError(
          freeSeats === 0
            ? 'This trip is fully booked.'
            : `Only ${freeSeats} seat${freeSeats === 1 ? '' : 's'} left.`,
          409,
        )
      }
      // A passenger may only have one active booking per trip.
      const existing = bookings.find(
        (b) => b.tripId === tripId && b.passengerId === account.user.id && b.status === 'confirmed',
      )
      if (existing) throw new ApiError('You already have a booking on this trip.', 409)

      const booking: Booking = {
        id: nextId('bkg'),
        tripId,
        passengerId: account.user.id,
        seats: payload.seats,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }
      bookings.push(booking)
      trip.seatsBooked += payload.seats
      return { ...booking }
    },

    async update(token: string, bookingId: string, payload: BookingPayload): Promise<Booking> {
      await delay()
      const account = requireAccount(token)
      const booking = bookings.find(
        (b) => b.id === bookingId && b.passengerId === account.user.id && b.status === 'confirmed',
      )
      if (!booking) throw new ApiError('Booking not found.', 404)
      const trip = MOCK_TRIPS.find((t) => t.id === booking.tripId)
      if (!trip) throw new ApiError('Trip not found.', 404)
      if (!Number.isInteger(payload.seats) || payload.seats < 1) {
        throw new ApiError('You must book at least 1 seat.', 400)
      }
      const freeSeats = trip.seatsTotal - trip.seatsBooked + booking.seats
      if (payload.seats > freeSeats) {
        throw new ApiError(`Only ${freeSeats} seat${freeSeats === 1 ? '' : 's'} available.`, 409)
      }
      trip.seatsBooked += payload.seats - booking.seats
      booking.seats = payload.seats
      return { ...booking }
    },

    async cancel(token: string, bookingId: string): Promise<void> {
      await delay()
      const account = requireAccount(token)
      const booking = bookings.find(
        (b) => b.id === bookingId && b.passengerId === account.user.id && b.status === 'confirmed',
      )
      if (!booking) throw new ApiError('Booking not found.', 404)
      const trip = MOCK_TRIPS.find((t) => t.id === booking.tripId)
      if (trip) trip.seatsBooked = Math.max(0, trip.seatsBooked - booking.seats)
      booking.status = 'cancelled'
    },
  },
}
