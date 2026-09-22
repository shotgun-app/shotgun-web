/**
 * Trips store: manages search criteria, loading state, and search results.
 * Follows the architecture rule: UI -> Pinia Store -> Api.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { ApiError, type TripSearchParams, type TripWithDriver } from '@/types'

export const useTripsStore = defineStore('trips', () => {
  // --- STATE (reactive data using ref) ---
  // Any component that accesses `results` will automatically re-render when this changes.
  const results = ref<TripWithDriver[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const hasSearched = ref(false)

  // --- ACTIONS (functions that mutate state or perform async calls) ---
  async function search(params: TripSearchParams): Promise<boolean> {
    pending.value = true
    error.value = null

    try {
      results.value = await api.trips.search(params)
      hasSearched.value = true
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Unable to load trips. Please try again.'
      return false
    } finally {
      pending.value = false
    }
  }

  function clear(): void {
    results.value = []
    hasSearched.value = false
    error.value = null
  }

  return {
    results,
    pending,
    error,
    hasSearched,
    search,
    clear,
  }
})
