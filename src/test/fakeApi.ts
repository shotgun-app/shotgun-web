/**
 * Test-only in-memory stand-in for the real API, installed by src/test/setup.ts.
 *
 * Auth is a single "cookie": whoever logged in last is the current user, like the
 * browser session cookie against the Go backend. Call `resetFakeApi()` in beforeEach.
 */
import {
  ApiError,
  type Booking,
  type ChangePasswordPayload,
  type BookingPayload,
  type BookingWithTrip,
  type Credentials,
  type PublicUser,
  type RegisterPayload,
  type ResetPasswordPayload,
  type RidePayload,
  type Trip,
  type TripSearchParams,
  type TripWithDriver,
  type TripWithPassengers,
  type UpdateProfilePayload,
  type User,
  type Review,
  type ReviewPayload,
  type UserProfile,
} from '@/types'
import type { Api } from '@/services/api'
import { MOCK_ACCOUNTS, type MockAccount } from './seed'

let accounts: MockAccount[] = []
let bookings: Booking[] = []
let trips: Trip[] = []
let reviews: Review[] = []
let currentUserId: string | null = null
/** Reset token -> email, filled by requestPasswordReset like the emailed link. */
let resetTokens = new Map<string, string>()

export function resetFakeApi(): void {
  accounts = MOCK_ACCOUNTS.map((a) => ({ ...a, user: { ...a.user } }))
  bookings = []
  trips = []
  reviews = []
  currentUserId = null
  resetTokens = new Map()
}
resetFakeApi()

/** Live trips, for specs that assert on server-side state such as seatsBooked. */
export function getFakeTrips(): Trip[] {
  return trips
}

/** The token a real user would get by email, for specs that walk the reset flow. */
export function getFakeResetToken(email: string): string | undefined {
  return [...resetTokens].find(([, e]) => e === email.trim().toLowerCase())?.[0]
}

function findByEmail(email: string): MockAccount | undefined {
  return accounts.find((a) => a.user.email.toLowerCase() === email.trim().toLowerCase())
}

function requireAccount(): MockAccount {
  const account = currentUserId && accounts.find((a) => a.user.id === currentUserId)
  if (!account) throw new ApiError('Not signed in.', 401)
  return account
}

function publicUserOf(userId: string): PublicUser | undefined {
  const user = accounts.find((a) => a.user.id === userId)?.user
  return user && { id: user.id, name: user.name, joinedAt: user.joinedAt }
}

function withPassengers(trip: Trip): TripWithPassengers {
  const passengers = bookings
    .filter((b) => b.tripId === trip.id && b.status === 'confirmed')
    .flatMap((b) => {
      const p = publicUserOf(b.passengerId)
      if (!p) return []
      const reviewed = currentUserId
        ? reviews.some(
            (r) =>
              r.rideId === trip.id &&
              r.reviewerId === currentUserId &&
              r.revieweeId === b.passengerId,
          )
        : false
      return [{ ...p, reviewed }]
    })
  return { ...trip, passengers }
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

const MAX_SEATS = 15

function assertValidRide(payload: RidePayload, minSeats: number): void {
  if (
    !payload.originCity.trim() ||
    !payload.originCountry.trim() ||
    !payload.destinationCity.trim() ||
    !payload.destinationCountry.trim() ||
    !payload.departureAt
  ) {
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

export const fakeApi: Api = {
  auth: {
    async login({ email, password }: Credentials): Promise<User> {
      const account = findByEmail(email)
      if (!account || account.password !== password) {
        throw new ApiError('Wrong email or password.', 401)
      }
      currentUserId = account.user.id
      return { ...account.user }
    },

    async register({ email, password, name, phone }: RegisterPayload): Promise<User> {
      if (findByEmail(email)) {
        throw new ApiError('An account with that email already exists.', 409)
      }
      const user: User = {
        id: `usr_${accounts.length + 1}`,
        email: email.trim(),
        name: name.trim(),
        phone,
        joinedAt: new Date().toISOString(),
      }
      accounts.push({ password, user })
      currentUserId = user.id
      return { ...user }
    },

    async logout(): Promise<void> {
      currentUserId = null
    },

    async me(): Promise<User> {
      return { ...requireAccount().user }
    },

    async updateProfile(payload: UpdateProfilePayload): Promise<User> {
      const account = requireAccount()
      const conflict = accounts.find(
        (a) =>
          a.user.email.toLowerCase() === payload.email.trim().toLowerCase() &&
          a.user.id !== account.user.id,
      )
      if (conflict) throw new ApiError('An account with that email already exists.', 409)
      account.user.name = payload.name.trim()
      account.user.email = payload.email.trim()
      account.user.phone = payload.phone.trim() || null
      return { ...account.user }
    },

    async changePassword(payload: ChangePasswordPayload): Promise<void> {
      const account = requireAccount()
      if (account.password !== payload.currentPassword) {
        throw new ApiError('Current password is incorrect.', 401)
      }
      if (payload.newPassword.length < 8) {
        throw new ApiError('Password must be at least 8 characters.', 400)
      }
      account.password = payload.newPassword
    },

    async requestPasswordReset(email: string): Promise<void> {
      const account = findByEmail(email)
      if (!account) return
      for (const [token, e] of resetTokens)
        if (e === email.trim().toLowerCase()) resetTokens.delete(token)
      resetTokens.set(nextId('reset'), email.trim().toLowerCase())
    },

    async checkResetToken(token: string): Promise<void> {
      if (!resetTokens.has(token))
        throw new ApiError('This reset link is invalid or has expired.', 400)
    },

    async resetPassword({ token, password }: ResetPasswordPayload): Promise<void> {
      if (password.length < 8) throw new ApiError('Password must be at least 8 characters.', 400)
      const email = resetTokens.get(token)
      const account = email ? findByEmail(email) : undefined
      if (!account) throw new ApiError('This reset link is invalid or has expired.', 400)
      account.password = password
      resetTokens.delete(token)
      currentUserId = null
    },

    async deleteAccount(): Promise<void> {
      const account = requireAccount()
      accounts = accounts.filter((a) => a !== account)
      currentUserId = null
    },
  },

  trips: {
    async search(params: TripSearchParams): Promise<TripWithDriver[]> {
      const origin = (params.originCity || '').trim().toLowerCase()
      const destination = (params.destinationCity || '').trim().toLowerCase()

      const matching = trips.filter((trip) => {
        if (origin && trip.originCity.toLowerCase() !== origin) return false
        if (destination && trip.destinationCity.toLowerCase() !== destination) return false

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

    async listMine(): Promise<TripWithPassengers[]> {
      const account = requireAccount()
      return trips
        .filter((trip) => trip.driverId === account.user.id)
        .sort((a, b) => a.departureAt.localeCompare(b.departureAt))
        .map(withPassengers)
    },

    async create(payload: RidePayload): Promise<TripWithPassengers> {
      const account = requireAccount()
      assertValidRide(payload, 1)

      const trip: Trip = {
        id: nextId('trip'),
        driverId: account.user.id,
        originCity: payload.originCity.trim(),
        originCountry: payload.originCountry.trim(),
        destinationCity: payload.destinationCity.trim(),
        destinationCountry: payload.destinationCountry.trim(),
        departureAt: payload.departureAt,
        seatsTotal: payload.seatsTotal,
        seatsBooked: 0,
        pricePerSeat: payload.pricePerSeat ?? 0,
        currency: payload.currency ?? 'EUR',
        notes: payload.notes ?? '',
        createdAt: new Date().toISOString(),
      }
      trips.push(trip)
      return withPassengers(trip)
    },

    async update(tripId: string, payload: RidePayload): Promise<TripWithPassengers> {
      const account = requireAccount()
      const trip = trips.find((t) => t.id === tripId && t.driverId === account.user.id)
      if (!trip) {
        throw new ApiError('Ride not found.', 404)
      }
      assertValidRide(payload, Math.max(1, trip.seatsBooked))

      trip.originCity = payload.originCity.trim()
      trip.originCountry = payload.originCountry.trim()
      trip.destinationCity = payload.destinationCity.trim()
      trip.destinationCountry = payload.destinationCountry.trim()
      trip.departureAt = payload.departureAt
      trip.seatsTotal = payload.seatsTotal
      if (payload.pricePerSeat !== undefined) trip.pricePerSeat = payload.pricePerSeat
      if (payload.currency) trip.currency = payload.currency
      if (payload.notes !== undefined) trip.notes = payload.notes
      return withPassengers(trip)
    },

    async remove(tripId: string): Promise<void> {
      const account = requireAccount()
      const index = trips.findIndex((t) => t.id === tripId && t.driverId === account.user.id)
      if (index === -1) {
        throw new ApiError('Ride not found.', 404)
      }
      trips.splice(index, 1)
      // Bookings only ever reference a trip, so clean them up alongside it.
      for (let i = bookings.length - 1; i >= 0; i--) {
        if (bookings[i]!.tripId === tripId) bookings.splice(i, 1)
      }
    },
  },

  bookings: {
    async listMine(): Promise<BookingWithTrip[]> {
      const account = requireAccount()
      const userId = account.user.id

      return bookings
        .filter((b) => b.passengerId === userId && b.status === 'confirmed')
        .sort((a, b) => {
          const tripA = trips.find((t) => t.id === a.tripId)
          const tripB = trips.find((t) => t.id === b.tripId)
          return (tripA?.departureAt ?? '').localeCompare(tripB?.departureAt ?? '')
        })
        .map((b) => {
          const trip = trips.find((t) => t.id === b.tripId)
          const driver = trip && publicUserOf(trip.driverId)

          if (!trip || !driver) {
            throw new ApiError('Trip not found.', 404)
          }

          const reviewed = reviews.some(
            (review) => review.rideId === trip.id && review.reviewerId === userId,
          )

          return {
            ...b,
            trip: { ...withPassengers(trip), driver },
            reviewed,
          }
        })
    },

    async create(tripId: string, payload: BookingPayload): Promise<Booking> {
      const account = requireAccount()
      const trip = trips.find((t) => t.id === tripId)
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

    async update(bookingId: string, payload: BookingPayload): Promise<Booking> {
      const account = requireAccount()
      const booking = bookings.find(
        (b) => b.id === bookingId && b.passengerId === account.user.id && b.status === 'confirmed',
      )
      if (!booking) throw new ApiError('Booking not found.', 404)
      const trip = trips.find((t) => t.id === booking.tripId)
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

    async cancel(bookingId: string): Promise<void> {
      const account = requireAccount()
      const booking = bookings.find(
        (b) => b.id === bookingId && b.passengerId === account.user.id && b.status === 'confirmed',
      )
      if (!booking) throw new ApiError('Booking not found.', 404)
      const trip = trips.find((t) => t.id === booking.tripId)
      if (trip) trip.seatsBooked = Math.max(0, trip.seatsBooked - booking.seats)
      booking.status = 'cancelled'
    },
  },

  reviews: {
    async create(payload: ReviewPayload): Promise<Review> {
      const account = requireAccount()
      const trip = trips.find((trip) => trip.id === payload.rideId)

      if (!trip) {
        throw new ApiError('Ride not found.', 404)
      }

      if (account.user.id === payload.targetId) {
        throw new ApiError('You cannot review yourself.', 403)
      }

      const isDriver = trip.driverId === account.user.id
      const targetIsDriver = trip.driverId === payload.targetId

      const myBooking = bookings.find(
        (b) =>
          b.tripId === payload.rideId &&
          b.passengerId === account.user.id &&
          b.status === 'confirmed',
      )
      const targetBooking = bookings.find(
        (b) =>
          b.tripId === payload.rideId &&
          b.passengerId === payload.targetId &&
          b.status === 'confirmed',
      )

      const isPassenger = !!myBooking
      const targetIsPassenger = !!targetBooking

      if (!((isDriver && targetIsPassenger) || (isPassenger && targetIsDriver))) {
        throw new ApiError('You cannot review this user for this ride.', 403)
      }

      if (new Date(trip.departureAt) >= new Date()) {
        throw new ApiError('You cannot review a future ride.', 400)
      }

      if (payload.rating < 1 || payload.rating > 5) {
        throw new ApiError('Rating must be between 1 and 5.', 400)
      }

      const duplicate = reviews.some(
        (review) =>
          review.rideId === payload.rideId &&
          review.reviewerId === account.user.id &&
          review.revieweeId === payload.targetId,
      )

      if (duplicate) {
        throw new ApiError('You already reviewed this user for this ride.', 409)
      }

      const review: Review = {
        id: nextId('review'),
        rideId: payload.rideId,
        reviewerId: account.user.id,
        revieweeId: payload.targetId,
        rating: payload.rating,
        comment: payload.comment.trim(),
        createdAt: new Date().toISOString(),
      }

      reviews.push(review)

      return { ...review }
    },
  },

  users: {
    async get(userId: string): Promise<UserProfile> {
      requireAccount()
      const account = accounts.find((a) => a.user.id === userId)
      if (!account) throw new ApiError('User not found.', 404)
      const userReviews = reviews
        .filter((review) => review.revieweeId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        
      const driverReviews = userReviews.filter((r) => {
        const trip = trips.find((t) => t.id === r.rideId)
        return trip && trip.driverId === userId
      })

      const passengerReviews = userReviews.filter((r) => {
        const trip = trips.find((t) => t.id === r.rideId)
        return trip && trip.driverId !== userId
      })

      const driverScore =
        driverReviews.length === 0
          ? 0
          : driverReviews.reduce((sum, review) => sum + review.rating, 0) / driverReviews.length
          
      const passengerScore =
        passengerReviews.length === 0
          ? 0
          : passengerReviews.reduce((sum, review) => sum + review.rating, 0) / passengerReviews.length
          
      return {
        user: { ...account.user },
        driverScore,
        passengerScore,
        reviews: driverReviews.map((review) => ({ ...review })),
        passengerReviews: passengerReviews.map((review) => ({ ...review })),
      }
    },
  },
}
