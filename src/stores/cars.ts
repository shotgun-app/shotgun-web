/**
 * Cars store: the catalogue drivers pick from, and the pick itself, used on the profile page.
 * Kept apart from `auth.ts` so its errors do not show up in the profile and password forms.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { ApiError, type Car } from '@/types'

export const useCarsStore = defineStore('cars', () => {
  const cars = ref<Car[]>([])
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

  async function fetchAll(): Promise<void> {
    const list = await run(() => api.cars.list())
    if (list) cars.value = list
  }

  /** Picks the signed-in driver's car, or clears it with null. */
  async function select(carId: string | null): Promise<boolean> {
    const updated = await run(() => api.auth.setCar(carId))
    if (!updated) return false
    // Mutate in place so every consumer of the user updates instantly
    const auth = useAuthStore()
    if (auth.user) auth.user.car = updated.car ?? null
    return true
  }

  return { cars, pending, error, fetchAll, select }
})
