/**
 * Domain types shared by the mock layer, the (future) HTTP layer and the UI.
 * They mirror the JSON contract we expect from the Go backend in ../shotgun-api.
 *
 * Vocabulary follows the vision document: a *driver* publishes a **trip**,
 * a *passenger* books **seats** on it (a booking).
 */

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  phone: string | null
  joinedAt: string
  /** 0-5, average of the ratings received. Rating flows are release 4.0. */
  rating: number
  ratingCount: number
  /** Kilograms of CO2 saved by sharing instead of driving alone (release 5.0). */
  co2SavedKg: number
}

export interface Trip {
  id: string
  driverId: string
  origin: string
  destination: string
  departureAt: string
  seatsTotal: number
  seatsBooked: number
  pricePerSeat: number
  currency: string
  /** Free text the driver adds: car model, luggage room, meeting point. */
  notes: string
}

export type BookingStatus = 'confirmed' | 'cancelled'

export interface Booking {
  id: string
  tripId: string
  passengerId: string
  seats: number
  status: BookingStatus
  createdAt: string
}

export interface Session {
  token: string
  user: User
}

export interface Credentials {
  email: string
  password: string
}

export interface RegisterPayload extends Credentials {
  name: string
}

/** The shape every service error takes, so the UI never cares about transport. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
