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

export const EUROPEAN_LOCATIONS: Record<string, string[]> = {
  Sweden: ['Gothenburg', 'Stockholm', 'Malmö', 'Uppsala'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  France: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  Netherlands: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
  Spain: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh'],
  Italy: ['Rome', 'Milan', 'Florence', 'Naples'],
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

/** Account the login form is prefilled with, so the demo is one click away. */
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

export function getTodayDateString(daysOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip_1',
    driverId: 'usr_1',
    origin: 'Gothenburg',
    destination: 'Stockholm',
    departureAt: relativeDate(0, 8, 30),
    seatsTotal: 3,
    seatsBooked: 1,
    pricePerSeat: 25,
    currency: 'EUR',
    notes: 'Volvo XC60. Plenty of trunk space for luggage. Meeting at Korsvägen.',
  },
  {
    id: 'trip_2',
    driverId: 'usr_3',
    origin: 'Gothenburg',
    destination: 'Stockholm',
    departureAt: relativeDate(0, 14, 0),
    seatsTotal: 4,
    seatsBooked: 2,
    pricePerSeat: 22,
    currency: 'EUR',
    notes: 'Polestar 2. Quiet electric ride, coffee stop along lake Vättern.',
  },
  {
    id: 'trip_3',
    driverId: 'usr_2',
    origin: 'Stockholm',
    destination: 'Gothenburg',
    departureAt: relativeDate(1, 9, 0),
    seatsTotal: 3,
    seatsBooked: 0,
    pricePerSeat: 24,
    currency: 'EUR',
    notes: 'Volkswagen ID.4, non-smoking, friendly indie music playlist.',
  },
  {
    id: 'trip_4',
    driverId: 'usr_4',
    origin: 'Berlin',
    destination: 'Munich',
    departureAt: relativeDate(0, 7, 0),
    seatsTotal: 4,
    seatsBooked: 1,
    pricePerSeat: 35,
    currency: 'EUR',
    notes: 'BMW 3 Touring. Fast autobahn route, max 2 medium bags per person.',
  },
  {
    id: 'trip_5',
    driverId: 'usr_1',
    origin: 'Berlin',
    destination: 'Munich',
    departureAt: relativeDate(0, 15, 30),
    seatsTotal: 3,
    seatsBooked: 0,
    pricePerSeat: 32,
    currency: 'EUR',
    notes: 'Golf VIII, picking up right outside Berlin Hauptbahnhof.',
  },
  {
    id: 'trip_6',
    driverId: 'usr_2',
    origin: 'Paris',
    destination: 'Lyon',
    departureAt: relativeDate(0, 10, 0),
    seatsTotal: 3,
    seatsBooked: 1,
    pricePerSeat: 28,
    currency: 'EUR',
    notes: 'Peugeot 308. Drop-off near Lyon Part-Dieu station.',
  },
  {
    id: 'trip_7',
    driverId: 'usr_3',
    origin: 'Amsterdam',
    destination: 'Rotterdam',
    departureAt: relativeDate(0, 9, 0),
    seatsTotal: 4,
    seatsBooked: 1,
    pricePerSeat: 12,
    currency: 'EUR',
    notes: 'Daily morning commute, quick and direct via A4.',
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
