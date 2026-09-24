import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useRidesStore } from '../rides'
import { useAuthStore } from '../auth'
import { useTripsStore } from '../trips'

describe('rides store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    // Use Ben's account: no seed bookings, so seat-floor tests stay independent.
    await useAuthStore().login({ email: 'ben@shotgun.app', password: 'password123' })
  })

  it('starts empty and fetches the driver-s own rides', async () => {
    const rides = useRidesStore()
    expect(rides.rides).toEqual([])

    await rides.create({
      origin: 'Amsterdam',
      destination: 'Rotterdam',
      departureAt: '2027-04-01T09:00:00Z',
      seatsTotal: 3,
    })

    await rides.fetchMine()
    expect(rides.rides.length).toBeGreaterThan(0)
  })

  it('creates a ride and sorts results soonest first', async () => {
    const rides = useRidesStore()

    await rides.create({
      origin: 'Berlin',
      destination: 'Munich',
      departureAt: '2027-05-10T09:00:00Z',
      seatsTotal: 2,
    })
    await rides.create({
      origin: 'Berlin',
      destination: 'Munich',
      departureAt: '2027-05-01T09:00:00Z',
      seatsTotal: 1,
    })

    expect(rides.rides[0]!.departureAt).toBe('2027-05-01T09:00:00Z')
    expect(rides.rides[1]!.departureAt).toBe('2027-05-10T09:00:00Z')
  })

  it('updates a ride in place', async () => {
    const rides = useRidesStore()
    const ok1 = await rides.create({
      origin: 'Paris',
      destination: 'Lyon',
      departureAt: '2027-06-01T09:00:00Z',
      seatsTotal: 2,
    })
    expect(ok1).toBe(true)
    const rideId = rides.rides[0]!.id

    const ok2 = await rides.update(rideId, {
      origin: 'Paris',
      destination: 'Lyon',
      departureAt: '2027-06-01T09:00:00Z',
      seatsTotal: 4,
    })

    expect(ok2).toBe(true)
    expect(rides.rides.find((r) => r.id === rideId)?.seatsTotal).toBe(4)
  })

  it('deletes a ride and updates search results right away', async () => {
    const rides = useRidesStore()
    await rides.create({
      origin: 'Malmö',
      destination: 'Uppsala',
      departureAt: '2027-07-01T09:00:00Z',
      seatsTotal: 2,
    })
    const rideId = rides.rides[0]!.id

    const trips = useTripsStore()
    await trips.search({ originCity: 'Malmö', destinationCity: 'Uppsala' })
    expect(trips.results.some((r) => r.id === rideId)).toBe(true)

    const ok = await rides.remove(rideId)
    expect(ok).toBe(true)
    expect(rides.rides.find((r) => r.id === rideId)).toBeUndefined()

    await trips.search({ originCity: 'Malmö', destinationCity: 'Uppsala' })
    expect(trips.results.some((r) => r.id === rideId)).toBe(false)
  })

  it('sets an error and returns false when seats drop below what is booked', async () => {
    const rides = useRidesStore()
    await rides.fetchMine()
    // trip_3 (Stockholm -> Gothenburg) belongs to Ben with 0 bookings; use trip_1 instead via alice.
    await useAuthStore().login({ email: 'alice@shotgun.app', password: 'password123' })
    await rides.fetchMine()

    const ok = await rides.update('trip_1', {
      origin: 'Gothenburg',
      destination: 'Stockholm',
      departureAt: '2027-08-01T09:00:00Z',
      seatsTotal: 0,
    })

    expect(ok).toBe(false)
    expect(rides.error).toBeTruthy()
  })
})
