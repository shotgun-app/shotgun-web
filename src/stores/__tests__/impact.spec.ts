import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetFakeApi, setFakeImpact } from '@/test/fakeApi'
import { useImpactStore } from '../impact'

describe('useImpactStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('fetches impact data and computes derived metrics', async () => {
    setFakeImpact({
      co2ConsumedKg: 20,
      co2WouldHaveBeenConsumedKg: 100,
      co2SavedKg: 80,
      totalCompletedRides: 4,
      totalSharedRides: 3,
      totalPassengers: 8,
      individualRidesSaved: 8,
      driversWithoutShotgun: 12,
      totalDistanceKm: 800,
    })

    const store = useImpactStore()
    expect(store.impact).toBeNull()

    await store.fetch()

    expect(store.impact).not.toBeNull()
    expect(store.co2ConsumedKg).toBe(20)
    expect(store.co2WouldHaveBeenConsumedKg).toBe(100)
    expect(store.co2SavedKg).toBe(80)
    expect(store.totalCompletedRides).toBe(4)
    expect(store.totalPassengers).toBe(8)
    expect(store.individualRidesSaved).toBe(8)
    expect(store.driversWithoutShotgun).toBe(12)
    expect(store.percentSaved).toBe(80)
  })

  it('handles empty state with default 0s', async () => {
    setFakeImpact(null)
    const store = useImpactStore()
    await store.fetch()

    expect(store.co2ConsumedKg).toBe(0)
    expect(store.co2WouldHaveBeenConsumedKg).toBe(0)
    expect(store.co2SavedKg).toBe(0)
    expect(store.percentSaved).toBe(0)
  })
})
