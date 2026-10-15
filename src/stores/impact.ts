/**
 * Sustainability Impact store: manages live aggregate metrics for all completed rides.
 * Public and unauthenticated.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { ApiError, type SustainabilityImpact } from '@/types'

export const useImpactStore = defineStore('impact', () => {
  const impact = ref<SustainabilityImpact | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetch(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      const data = await api.impact.get()
      impact.value = data
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Unable to load impact metrics.'
    } finally {
      pending.value = false
    }
  }

  const co2ConsumedKg = computed(
    () => impact.value?.co2ConsumedKg ?? impact.value?.co2_consumed_kg ?? 0,
  )
  const co2WouldHaveBeenConsumedKg = computed(
    () =>
      impact.value?.co2WouldHaveBeenConsumedKg ??
      impact.value?.co2_would_have_been_consumed_kg ??
      0,
  )
  const co2SavedKg = computed(() => impact.value?.co2SavedKg ?? impact.value?.co2_saved_kg ?? 0)

  const totalCompletedRides = computed(
    () => impact.value?.totalCompletedRides ?? impact.value?.total_completed_rides ?? 0,
  )
  const totalSharedRides = computed(
    () => impact.value?.totalSharedRides ?? impact.value?.total_shared_rides ?? 0,
  )
  const totalPassengers = computed(
    () => impact.value?.totalPassengers ?? impact.value?.total_passengers ?? 0,
  )
  const individualRidesSaved = computed(
    () => impact.value?.individualRidesSaved ?? impact.value?.individual_rides_saved ?? 0,
  )
  const driversWithoutShotgun = computed(
    () => impact.value?.driversWithoutShotgun ?? impact.value?.drivers_without_shotgun ?? 0,
  )
  const totalDistanceKm = computed(
    () => impact.value?.totalDistanceKm ?? impact.value?.total_distance_km ?? 0,
  )

  const percentSaved = computed(() => {
    if (co2WouldHaveBeenConsumedKg.value <= 0) return 0
    return Math.round((co2SavedKg.value / co2WouldHaveBeenConsumedKg.value) * 100)
  })

  return {
    impact,
    pending,
    error,
    fetch,
    co2ConsumedKg,
    co2WouldHaveBeenConsumedKg,
    co2SavedKg,
    totalCompletedRides,
    totalSharedRides,
    totalPassengers,
    individualRidesSaved,
    driversWithoutShotgun,
    totalDistanceKm,
    percentSaved,
  }
})
