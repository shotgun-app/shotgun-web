/** Seed data for the test-only fake API (src/test/fakeApi.ts). Not part of the app bundle. */
import type { Booking, Trip, User } from '@/types'

/** Passwords are plain text on purpose: test double only. */
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
  {
    password: 'password123',
    user: {
      id: 'usr_3',
      email: 'clara@shotgun.app',
      name: 'Clara Lindqvist',
      avatarUrl: null,
      phone: '+46 70 123 4567',
      joinedAt: '2026-02-10T11:00:00Z',
      rating: 4.9,
      ratingCount: 32,
      co2SavedKg: 195.2,
    },
  },
  {
    password: 'password123',
    user: {
      id: 'usr_4',
      email: 'markus@shotgun.app',
      name: 'Markus Schmidt',
      avatarUrl: null,
      phone: '+49 151 2345678',
      joinedAt: '2026-02-18T14:30:00Z',
      rating: 4.7,
      ratingCount: 19,
      co2SavedKg: 88.6,
    },
  },
]

/** Seeded account most specs log in as. */
export const DEMO_CREDENTIALS = {
  email: 'alice@shotgun.app',
  password: 'password123',
}

/** Helper to generate ISO departure timestamps relative to today */
export function relativeDate(daysAhead: number, hours: number, minutes: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const min = String(minutes).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}:00Z`
}

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip_1',
    driverId: 'usr_1',
    originCity: 'Gothenburg',
    originCountry: 'Sweden',
    destinationCity: 'Stockholm',
    destinationCountry: 'Sweden',
    departureAt: relativeDate(0, 8, 30),
    seatsTotal: 3,
    seatsBooked: 1,
    pricePerSeat: 25,
    currency: 'EUR',
    notes: 'Volvo XC60. Plenty of trunk space for luggage. Meeting at Korsvägen.',
    createdAt: '2026-09-20T08:00:00Z',
  },
  {
    id: 'trip_2',
    driverId: 'usr_3',
    originCity: 'Gothenburg',
    originCountry: 'Sweden',
    destinationCity: 'Stockholm',
    destinationCountry: 'Sweden',
    departureAt: relativeDate(0, 14, 0),
    seatsTotal: 4,
    seatsBooked: 2,
    pricePerSeat: 22,
    currency: 'EUR',
    notes: 'Polestar 2. Quiet electric ride, coffee stop along lake Vättern.',
    createdAt: '2026-09-20T09:00:00Z',
  },
  {
    id: 'trip_3',
    driverId: 'usr_2',
    originCity: 'Stockholm',
    originCountry: 'Sweden',
    destinationCity: 'Gothenburg',
    destinationCountry: 'Sweden',
    departureAt: relativeDate(1, 9, 0),
    seatsTotal: 3,
    seatsBooked: 0,
    pricePerSeat: 24,
    currency: 'EUR',
    notes: 'Volkswagen ID.4, non-smoking, friendly indie music playlist.',
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'trip_4',
    driverId: 'usr_4',
    originCity: 'Berlin',
    originCountry: 'Germany',
    destinationCity: 'Munich',
    destinationCountry: 'Germany',
    departureAt: relativeDate(0, 7, 0),
    seatsTotal: 4,
    seatsBooked: 1,
    pricePerSeat: 35,
    currency: 'EUR',
    notes: 'BMW 3 Touring. Fast autobahn route, max 2 medium bags per person.',
    createdAt: '2026-09-20T11:00:00Z',
  },
  {
    id: 'trip_5',
    driverId: 'usr_1',
    originCity: 'Berlin',
    originCountry: 'Germany',
    destinationCity: 'Munich',
    destinationCountry: 'Germany',
    departureAt: relativeDate(0, 15, 30),
    seatsTotal: 3,
    seatsBooked: 0,
    pricePerSeat: 32,
    currency: 'EUR',
    notes: 'Golf VIII, picking up right outside Berlin Hauptbahnhof.',
    createdAt: '2026-09-20T12:00:00Z',
  },
  {
    id: 'trip_6',
    driverId: 'usr_2',
    originCity: 'Paris',
    originCountry: 'France',
    destinationCity: 'Lyon',
    destinationCountry: 'France',
    departureAt: relativeDate(0, 10, 0),
    seatsTotal: 3,
    seatsBooked: 1,
    pricePerSeat: 28,
    currency: 'EUR',
    notes: 'Peugeot 308. Drop-off near Lyon Part-Dieu station.',
    createdAt: '2026-09-20T13:00:00Z',
  },
  {
    id: 'trip_7',
    driverId: 'usr_3',
    originCity: 'Amsterdam',
    originCountry: 'Netherlands',
    destinationCity: 'Rotterdam',
    destinationCountry: 'Netherlands',
    departureAt: relativeDate(0, 9, 0),
    seatsTotal: 4,
    seatsBooked: 1,
    pricePerSeat: 12,
    currency: 'EUR',
    notes: 'Daily morning commute, quick and direct via A4.',
    createdAt: '2026-09-20T14:00:00Z',
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

