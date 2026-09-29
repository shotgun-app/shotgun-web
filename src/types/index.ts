/**
 * Domain types shared by the HTTP layer and the UI.
 * They mirror the JSON contract of the Go backend in ../shotgun-api.
 *
 * Vocabulary follows the vision document: a *driver* publishes a **trip**,
 * a *passenger* books **seats** on it (a booking).
 */

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  joinedAt: string
  /** Not served by the backend yet (rating flows are release 4.0, CO2 release 5.0). */
  avatarUrl?: string | null
  /** 0-5, average of the ratings received. */
  rating?: number
  ratingCount?: number
  /** Kilograms of CO2 saved by sharing instead of driving alone. */
  co2SavedKg?: number
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

export interface TripWithDriver extends Trip {
  driver: User
}

export interface TripSearchParams {
  originCity: string
  destinationCity: string
  departureDate?: string
  departureTime?: string
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

/** Payload for creating or updating a booking. */
export interface BookingPayload {
  seats: number
}

/** A confirmed booking together with a snapshot of the trip it belongs to. */
export interface BookingWithTrip extends Booking {
  trip: Trip
}

export interface Credentials {
  email: string
  password: string
}

export interface RegisterPayload extends Credentials {
  name: string
}

export interface UpdateProfilePayload {
  name: string
  email: string
  /** E.164 ("+38640123456"), or '' to remove the number. */
  phone: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

/** Fields a driver sets when offering or editing a ride. */
export interface RidePayload {
  origin: string
  destination: string
  departureAt: string
  seatsTotal: number
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
