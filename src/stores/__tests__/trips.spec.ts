import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTripsStore } from '../trips'
import { getTodayDateString } from '@/mock/data'

describe('trips store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty results and hasSearched=false', () => {
    const store = useTripsStore()
    expect(store.results).toEqual([])
    expect(store.hasSearched).toBe(false)
    expect(store.pending).toBe(false)
    expect(store.error).toBeNull()
  })

  it('searches for trips between Gothenburg and Stockholm and attaches drivers', async () => {
    const store = useTripsStore()

    const ok = await store.search({
      originCity: 'Gothenburg',
      destinationCity: 'Stockholm',
      departureDate: getTodayDateString(),
    })

    expect(ok).toBe(true)
    expect(store.hasSearched).toBe(true)
    expect(store.pending).toBe(false)
    expect(store.results.length).toBeGreaterThan(0)
    const firstTrip = store.results[0]!
    expect(firstTrip.origin).toBe('Gothenburg')
    expect(firstTrip.destination).toBe('Stockholm')
    expect(firstTrip.driver).toBeDefined()
    expect(firstTrip.driver.name).toBeTruthy()
  })

  it('returns empty results when no trips match', async () => {
    const store = useTripsStore()

    const ok = await store.search({
      originCity: 'Stockholm',
      destinationCity: 'Paris',
    })

    expect(ok).toBe(true)
    expect(store.hasSearched).toBe(true)
    expect(store.results).toEqual([])
  })

  it('clears results and search state', async () => {
    const store = useTripsStore()
    await store.search({
      originCity: 'Gothenburg',
      destinationCity: 'Stockholm',
    })

    expect(store.results.length).toBeGreaterThan(0)
    store.clear()
    expect(store.results).toEqual([])
    expect(store.hasSearched).toBe(false)
  })
})
