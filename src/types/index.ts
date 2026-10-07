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

/**
 * A ride offered by a driver.
 * Field names mirror the Go backend's JSON response exactly (`rides.go` handler).
 */
export interface Trip {
  id: string
  driverId: string
  originCity: string
  originCountry: string
  destinationCity: string
  destinationCountry: string
  departureAt: string
  seatsTotal: number
  seatsBooked: number
  pricePerSeat: number
  currency: string
  /** Free text: car model, luggage, meeting point. */
  notes: string
  createdAt: string
}

/** What the API reveals about a driver or passenger to other users: no email or phone. */
export type PublicUser = Omit<User, 'email' | 'phone'>

export interface TripWithDriver extends Trip {
  driver: PublicUser
}

/** A trip as its driver and passengers see it. Search results leave passengers out. */
export interface TripWithPassengers extends Trip {
  /** Confirmed passengers, in booking order. */
  passengers: PublicUser[]
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
  trip: TripWithDriver & TripWithPassengers
  reviewed: boolean
}

export interface Review {
  id: string
  rideId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string
  createdAt: string
}

export interface ReviewPayload {
  rideId: string
  rating: number
  comment: string
}

export interface Credentials {
  email: string
  password: string
}

export interface RegisterPayload extends Credentials {
  name: string
  /** E.164 ("+38640123456"), required. */
  phone: string
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

/** Fields a driver sends when creating or editing a ride. Mirrors the Go backend's `rideRequest`. */
export interface RidePayload {
  originCity: string
  originCountry: string
  destinationCity: string
  destinationCountry: string
  departureAt: string
  seatsTotal: number
  pricePerSeat: number
  currency?: string
  notes?: string
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
