/**
 * The seam between the UI and the backend. The UI only ever imports `api` from here.
 * Requests are authenticated by the HttpOnly session cookie the backend sets on login,
 * so no method takes a token.
 */
import type {
  Booking,
  ChangePasswordPayload,
  BookingPayload,
  BookingWithTrip,
  Credentials,
  RegisterPayload,
  RidePayload,
  Trip,
  TripSearchParams,
  TripWithDriver,
  UpdateProfilePayload,
  User,
} from '@/types'
import { httpApi } from './http'

export interface AuthApi {
  login(credentials: Credentials): Promise<User>
  register(payload: RegisterPayload): Promise<User>
  logout(): Promise<void>
  /** Resolves the user behind the session cookie, or throws ApiError(401). */
  me(): Promise<User>
  /** Updates name and/or email for the authenticated user. */
  updateProfile(payload: UpdateProfilePayload): Promise<User>
  /** Verifies the current password; the backend ends the user's other sessions. */
  changePassword(payload: ChangePasswordPayload): Promise<void>
  /** Permanently removes the account. The caller is responsible for clearing the session. */
  deleteAccount(): Promise<void>
}

export interface TripsApi {
  search(params: TripSearchParams): Promise<TripWithDriver[]>
  /** Rides the authenticated user is driving, soonest first. */
  listMine(): Promise<Trip[]>
  create(payload: RidePayload): Promise<Trip>
  /** Free seats can't be set below the seats already booked; the seam enforces this. */
  update(tripId: string, payload: RidePayload): Promise<Trip>
  /** Deletes the ride and its bookings. */
  remove(tripId: string): Promise<void>
}

export interface BookingsApi {
  /** Confirmed bookings for the authenticated passenger, soonest-departing first. */
  listMine(): Promise<BookingWithTrip[]>
  /** Book seats on a trip; returns the new booking. */
  create(tripId: string, payload: BookingPayload): Promise<Booking>
  /** Change the seat count on an existing confirmed booking. */
  update(bookingId: string, payload: BookingPayload): Promise<Booking>
  /** Cancel a confirmed booking; freed seats are returned to the trip. */
  cancel(bookingId: string): Promise<void>
}

export interface Api {
  auth: AuthApi
  trips: TripsApi
  bookings: BookingsApi
}

export const api: Api = httpApi
