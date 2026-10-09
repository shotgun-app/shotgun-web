/**
 * Rides store: a driver's own rides (create / edit / delete), backed by `api.trips`.
 * Follows the same shape as `auth.ts`: UI -> store -> api, ApiError -> plain string.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { ApiError, type RidePayload, type TripWithPassengers, type ReviewPayload } from '@/types'

function byDepartureAt(a: TripWithPassengers, b: TripWithPassengers): number {
  return a.departureAt.localeCompare(b.departureAt)
}

export const useRidesStore = defineStore('rides', () => {
  const rides = ref<TripWithPassengers[]>([])
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
    if (!auth.user) return
    const list = await run(() => api.trips.listMine())
    if (list) rides.value = list
  }

  async function create(payload: RidePayload): Promise<boolean> {
    const auth = useAuthStore()
    if (!auth.user) return false
    const trip = await run(() => api.trips.create(payload))
    if (!trip) return false
    rides.value = [...rides.value, trip].sort(byDepartureAt)
    return true
  }

  async function update(tripId: string, payload: RidePayload): Promise<boolean> {
    const auth = useAuthStore()
    if (!auth.user) return false
    const trip = await run(() => api.trips.update(tripId, payload))
    if (!trip) return false
    rides.value = rides.value.map((r) => (r.id === tripId ? trip : r)).sort(byDepartureAt)
    return true
  }

  async function remove(tripId: string): Promise<boolean> {
    const auth = useAuthStore()
    if (!auth.user) return false
    pending.value = true
    error.value = null
    try {
      await api.trips.remove(tripId)
      rides.value = rides.value.filter((r) => r.id !== tripId)
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
      return false
    } finally {
      pending.value = false
    }
  }

  async function reviewPassenger(payload: ReviewPayload): Promise<boolean> {
    const auth = useAuthStore()
    if (!auth.user) return false
    pending.value = true
    error.value = null
    try {
      await api.reviews.create(payload)
      const trip = rides.value.find((r) => r.id === payload.rideId)
      if (trip) {
        const passenger = trip.passengers.find((p) => p.id === payload.targetId)
        if (passenger) passenger.reviewRating = payload.rating
      }
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
      return false
    } finally {
      pending.value = false
    }
  }

  return {
    rides,
    pending,
    error,
    fetchMine,
    create,
    update,
    remove,
    reviewPassenger,
  }
})
