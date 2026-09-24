/**
 * Bookings store: a passenger's own bookings (create / update seats / cancel).
 * Follows the same shape as `rides.ts`: UI -> store -> api, ApiError -> plain string.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { ApiError, type Booking, type BookingPayload, type BookingWithTrip } from '@/types'

function byTripDeparture(a: BookingWithTrip, b: BookingWithTrip): number {
  return a.trip.departureAt.localeCompare(b.trip.departureAt)
}

export const useBookingsStore = defineStore('bookings', () => {
  const bookings = ref<BookingWithTrip[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    pending.value = true
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
      return null
    } finally {
      pending.value = false
    }
  }

  async function fetchMine(): Promise<void> {
    const auth = useAuthStore()
    if (!auth.token) return
    const list = await run(() => api.bookings.listMine(auth.token!))
    if (list) bookings.value = list
  }

  /** Books seats on a trip and adds the resulting booking to the local list. */
  async function create(tripId: string, payload: BookingPayload): Promise<Booking | null> {
    const auth = useAuthStore()
    if (!auth.token) return null
    const booking = await run(() => api.bookings.create(auth.token!, tripId, payload))
    if (!booking) return null
    // Re-fetch so the embedded trip snapshot is up to date.
    await fetchMine()
    return booking
  }

  /** Updates the seat count on an existing booking. */
  async function update(bookingId: string, payload: BookingPayload): Promise<boolean> {
    const auth = useAuthStore()
    if (!auth.token) return false
    const updated = await run(() => api.bookings.update(auth.token!, bookingId, payload))
    if (!updated) return false
    bookings.value = bookings.value
      .map((b) => (b.id === bookingId ? { ...b, seats: updated.seats } : b))
      .sort(byTripDeparture)
    return true
  }

  /** Cancels a booking and removes it from the local list. */
  async function cancel(bookingId: string): Promise<boolean> {
    const auth = useAuthStore()
    if (!auth.token) return false
    pending.value = true
    error.value = null
    try {
      await api.bookings.cancel(auth.token, bookingId)
      bookings.value = bookings.value.filter((b) => b.id !== bookingId)
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
      return false
    } finally {
      pending.value = false
    }
  }

  return {
    bookings,
    pending,
    error,
    fetchMine,
    create,
    update,
    cancel,
  }
})
