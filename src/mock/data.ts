/**
 * THE single source of hardcoded data for the whole app.
 *
 * Everything fake lives here - users, credentials, trips, bookings. Nothing else
 * in `src/` should invent data. When ../shotgun-api is ready, the services in
 * `src/services/` switch to the HTTP client and this file can be deleted whole.
 */
import type { Booking, Trip, User } from '@/types'

/** Passwords are plain text on purpose: mock only, never shipped to a real backend. */
export interface MockAccount {
  password: string
  user: User
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    password: 'password123',
    user: {
      id: 'usr_1',
      email: 'alice@shotgun.app',
      name: 'Alice',
      avatarUrl: null,
      phone: '+1 415 555 0142',
      joinedAt: '2026-01-14T09:00:00Z',
      rating: 4.8,
      ratingCount: 24,
      co2SavedKg: 128.4,
    },
  },
  {
    password: 'password123',
    user: {
      id: 'usr_2',
      email: 'ben@shotgun.app',
      name: 'Ben Foster',
      avatarUrl: null,
      phone: '+1 415 555 0177',
      joinedAt: '2026-03-02T09:00:00Z',
      rating: 4.5,
      ratingCount: 11,
      co2SavedKg: 63.0,
    },
  },
]

/** Account the login form is prefilled with, so the demo is one click away. */
export const DEMO_CREDENTIALS = {
  email: 'alice@shotgun.app',
  password: 'password123',
}

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip_1',
    driverId: 'usr_1',
    origin: 'San Francisco',
    destination: 'Los Angeles',
    departureAt: '2026-09-25T07:30:00Z',
    seatsTotal: 3,
    seatsBooked: 1,
    pricePerSeat: 9,
    currency: 'EUR',
    notes: 'Golf VII, one medium bag per person. Meeting point: Caltrain station lot.',
  },
  {
    id: 'trip_2',
    driverId: 'usr_2',
    origin: 'Los Angeles',
    destination: 'San Francisco',
    departureAt: '2026-09-25T16:00:00Z',
    seatsTotal: 4,
    seatsBooked: 4,
    pricePerSeat: 8,
    currency: 'EUR',
    notes: 'Full. Non-smoking, no pets.',
  },
  {
    id: 'trip_3',
    driverId: 'usr_1',
    origin: 'San Francisco',
    destination: 'Sacramento',
    departureAt: '2026-09-27T06:00:00Z',
    seatsTotal: 3,
    seatsBooked: 0,
    pricePerSeat: 11,
    currency: 'EUR',
    notes: 'Early start, coffee stop in Davis.',
  },
]

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bkg_1',
    tripId: 'trip_1',
    passengerId: 'usr_2',
    seats: 1,
    status: 'confirmed',
    createdAt: '2026-09-20T12:10:00Z',
  },
]
