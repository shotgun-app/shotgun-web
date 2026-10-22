/**
 * Domain types shared by the HTTP layer and the UI.
 * They mirror the JSON contract of the Go backend in ../shotgun-api.
 *
 * Vocabulary follows the vision document: a *driver* publishes a **trip**,
 * a *passenger* books **seats** on it (a booking).
 */

export interface Car {
  id: string
  brand: string
  model: string
  /** Grams of CO2 per km; 0 for fully electric cars. */
  co2: number
}

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  joinedAt: string
  /** Path of the profile picture on the backend, null without one. Use with `apiUrl`. */
  avatarUrl?: string | null
  /** 0-5, average of the ratings received. */
  rating?: number
  ratingCount?: number
  /** Kilograms of CO2 saved by sharing instead of driving alone. */
  co2SavedKg?: number
  /** The driver's car, or null when none is picked. Optional so seeded test users need none. */
  car?: Car | null
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
  /** Small = cabin bag (~50x50cm), large = suitcase. Counted and limited separately. */
  smallBagsTotal: number
  smallBagsBooked: number
  largeBagsTotal: number
  largeBagsBooked: number
  pricePerSeat: number
  currency: string
  /** Free text: car model, luggage, meeting point. */
  notes: string
  createdAt: string
  /** Driving distance in kilometers. */
  distanceKm?: number
  /** Total CO2 consumed by the vehicle for this trip in kg. */
  co2ConsumedKg?: number
  /** CO2 saved per passenger compared to driving alone in kg. */
  co2SavedKg?: number
  /** True when the driver's vehicle has zero direct emissions. */
  isElectric?: boolean
  /** Backend snake_case response compatibility. */
  distance_km?: number
  co2_consumed_kg?: number
  co2_saved_kg?: number
  is_electric?: boolean
}

/** What the API reveals about a driver or passenger to other users: no email or phone. */
export interface PublicUser extends Omit<User, 'email' | 'phone'> {
  /** The rating given by the authenticated user to this passenger/driver for a specific ride context. */
  reviewRating?: number
}

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
  smallBags: number
  largeBags: number
  status: BookingStatus
  createdAt: string
}

/** Payload for creating or updating a booking. */
export interface BookingPayload {
  seats: number
  /** Omitted bag counts mean none when creating and "keep as is" when updating. */
  smallBags?: number
  largeBags?: number
}

/** A confirmed booking together with a snapshot of the trip it belongs to. */
export interface BookingWithTrip extends Booking {
  trip: TripWithDriver & TripWithPassengers
  reviewRating?: number
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

/** CO2 a user saved in one role, counting completed rides only. */
export interface ProfileImpact {
  rides: number
  co2SavedKg: number
  ridesOfferedCount?: number
  driverCo2SavedKg?: number
  carsReducedCount?: number
}

export interface UserProfile {
  user: User
  driverScore: number
  passengerScore: number
  reviews: Review[]
  passengerReviews: Review[]
  passengerImpact: ProfileImpact
  driverImpact: ProfileImpact
  driver_co2_saved_kg?: number
  rides_offered_count?: number
  cars_reduced_count?: number
}

export interface ReviewPayload {
  rideId: string
  targetId: string
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

export interface ResetPasswordPayload {
  /** The `token` query param of the emailed link. */
  token: string
  password: string
}

/** One signed-in device of the user. */
export interface Session {
  id: string
  /** Raw User-Agent from login or register; '' for sessions created before it was stored. */
  userAgent: string
  createdAt: string
  expiresAt: string
  /** The session this browser is using. */
  current: boolean
}

/** Fields a driver sends when creating or editing a ride. Mirrors the Go backend's `rideRequest`. */
export interface RidePayload {
  originCity: string
  originCountry: string
  destinationCity: string
  destinationCountry: string
  departureAt: string
  seatsTotal: number
  smallBagsTotal?: number
  largeBagsTotal?: number
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

/** Aggregated platform-wide sustainability metrics for all completed rides. */
export interface SustainabilityImpact {
  co2ConsumedKg: number
  co2WouldHaveBeenConsumedKg: number
  co2SavedKg: number
  totalCompletedRides: number
  totalSharedRides: number
  totalPassengers: number
  individualRidesSaved: number
  driversWithoutShotgun: number
  totalDistanceKm: number
}
