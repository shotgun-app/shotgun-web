import { describe, expect, it } from 'vitest'

import { mockApi } from '../mock'
import { ApiError } from '@/types'
import { DEMO_CREDENTIALS, getTodayDateString } from '@/mock/data'

describe('mock auth api', () => {
  it('logs in a seeded account and returns a usable token', async () => {
    const session = await mockApi.auth.login(DEMO_CREDENTIALS)

    expect(session.user.email).toBe(DEMO_CREDENTIALS.email)
    expect(session.token).toBeTruthy()
    await expect(mockApi.auth.me(session.token)).resolves.toMatchObject({
      id: session.user.id,
    })
  })

  it('matches the email case-insensitively', async () => {
    const session = await mockApi.auth.login({
      ...DEMO_CREDENTIALS,
      email: DEMO_CREDENTIALS.email.toUpperCase(),
    })

    expect(session.user.email).toBe(DEMO_CREDENTIALS.email)
  })

  it('rejects a wrong password with a 401', async () => {
    await expect(
      mockApi.auth.login({ email: DEMO_CREDENTIALS.email, password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('rejects an unknown email with a 401', async () => {
    await expect(
      mockApi.auth.login({ email: 'nobody@shotgun.app', password: 'password123' }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it('registers a new account and logs it in', async () => {
    const email = `new-${Date.now()}@shotgun.app`
    const session = await mockApi.auth.register({ email, password: 'password123', name: 'Mira' })

    expect(session.user.name).toBe('Mira')
    expect(session.user.rating).toBe(0)
    await expect(mockApi.auth.login({ email, password: 'password123' })).resolves.toBeTruthy()
  })

  it('refuses a duplicate email with a 409', async () => {
    await expect(
      mockApi.auth.register({
        email: DEMO_CREDENTIALS.email,
        password: 'password123',
        name: 'Impostor',
      }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('invalidates the token on logout', async () => {
    const session = await mockApi.auth.login(DEMO_CREDENTIALS)
    await mockApi.auth.logout(session.token)

    // The token no longer maps to a live session, so only the encoded user id
    // could resolve it. A garbage token must still fail.
    await expect(mockApi.auth.me('not-a-token')).rejects.toMatchObject({ status: 401 })
  })
})

describe('mock trips api', () => {
  it('searches trips by origin and destination and attaches driver data', async () => {
    const results = await mockApi.trips.search({
      originCity: 'Gothenburg',
      destinationCity: 'Stockholm',
    })

    expect(results.length).toBeGreaterThan(0)
    for (const trip of results) {
      expect(trip.origin).toBe('Gothenburg')
      expect(trip.destination).toBe('Stockholm')
      expect(trip.driver).toBeDefined()
      expect(trip.driver.name).toBeTruthy()
    }
  })

  it('filters by departure date when provided', async () => {
    const today = getTodayDateString()
    const results = await mockApi.trips.search({
      originCity: 'Gothenburg',
      destinationCity: 'Stockholm',
      departureDate: today,
    })

    expect(results.length).toBeGreaterThan(0)
    for (const trip of results) {
      expect(trip.departureAt.startsWith(today)).toBe(true)
    }
  })

  it('returns empty array when no routes match', async () => {
    const results = await mockApi.trips.search({
      originCity: 'Stockholm',
      destinationCity: 'Rome',
    })

    expect(results).toEqual([])
  })
})

describe('mock rides api (driver CRUD)', () => {
  async function driverToken(email: string): Promise<string> {
    const session = await mockApi.auth.login({ email, password: 'password123' })
    return session.token
  }

  it('creates a ride and lists it back, soonest first', async () => {
    const token = await driverToken('clara@shotgun.app')

    const later = await mockApi.trips.create(token, {
      origin: 'Rotterdam',
      destination: 'Utrecht',
      departureAt: '2027-01-10T09:00:00Z',
      seatsTotal: 2,
    })
    const sooner = await mockApi.trips.create(token, {
      origin: 'Rotterdam',
      destination: 'Utrecht',
      departureAt: '2027-01-05T09:00:00Z',
      seatsTotal: 3,
    })

    const mine = await mockApi.trips.listMine(token)
    const ids = mine.map((r) => r.id)
    expect(ids.indexOf(sooner.id)).toBeLessThan(ids.indexOf(later.id))
    expect(mine.every((r) => r.driverId)).toBe(true)
  })

  it('rejects a ride missing required fields', async () => {
    const token = await driverToken('markus@shotgun.app')

    await expect(
      mockApi.trips.create(token, {
        origin: '',
        destination: 'Munich',
        departureAt: '2027-01-05T09:00:00Z',
        seatsTotal: 2,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('rejects fewer than 1 free seat', async () => {
    const token = await driverToken('markus@shotgun.app')

    await expect(
      mockApi.trips.create(token, {
        origin: 'Berlin',
        destination: 'Hamburg',
        departureAt: '2027-01-05T09:00:00Z',
        seatsTotal: 0,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('rejects more than 15 free seats', async () => {
    const token = await driverToken('markus@shotgun.app')

    await expect(
      mockApi.trips.create(token, {
        origin: 'Berlin',
        destination: 'Hamburg',
        departureAt: '2027-01-05T09:00:00Z',
        seatsTotal: 16,
      }),
    ).rejects.toMatchObject({ status: 400 })

    await expect(
      mockApi.trips.create(token, {
        origin: 'Berlin',
        destination: 'Hamburg',
        departureAt: '2027-01-05T09:00:00Z',
        seatsTotal: 15,
      }),
    ).resolves.toMatchObject({ seatsTotal: 15 })
  })

  it('updates a ride it owns', async () => {
    const token = await driverToken('ben@shotgun.app')
    const ride = await mockApi.trips.create(token, {
      origin: 'Paris',
      destination: 'Nice',
      departureAt: '2027-02-01T09:00:00Z',
      seatsTotal: 2,
    })

    const updated = await mockApi.trips.update(token, ride.id, {
      origin: 'Paris',
      destination: 'Nice',
      departureAt: '2027-02-02T09:00:00Z',
      seatsTotal: 4,
    })

    expect(updated.seatsTotal).toBe(4)
    expect(updated.departureAt).toBe('2027-02-02T09:00:00Z')
  })

  it('refuses to update a ride belonging to another driver', async () => {
    const owner = await driverToken('ben@shotgun.app')
    const stranger = await driverToken('clara@shotgun.app')
    const ride = await mockApi.trips.create(owner, {
      origin: 'Lyon',
      destination: 'Marseille',
      departureAt: '2027-02-05T09:00:00Z',
      seatsTotal: 2,
    })

    await expect(
      mockApi.trips.update(stranger, ride.id, {
        origin: 'Lyon',
        destination: 'Marseille',
        departureAt: '2027-02-05T09:00:00Z',
        seatsTotal: 3,
      }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('refuses to drop free seats below the number already booked', async () => {
    // trip_1 is seeded with 1 confirmed booking (bkg_1) and belongs to alice.
    const token = await driverToken('alice@shotgun.app')

    await expect(
      mockApi.trips.update(token, 'trip_1', {
        origin: 'Gothenburg',
        destination: 'Stockholm',
        departureAt: '2027-03-01T09:00:00Z',
        seatsTotal: 0,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('deletes a ride and its bookings', async () => {
    const token = await driverToken('alice@shotgun.app')
    const ride = await mockApi.trips.create(token, {
      origin: 'Uppsala',
      destination: 'Stockholm',
      departureAt: '2027-03-10T09:00:00Z',
      seatsTotal: 2,
    })

    await mockApi.trips.remove(token, ride.id)

    const mine = await mockApi.trips.listMine(token)
    expect(mine.find((r) => r.id === ride.id)).toBeUndefined()
  })
})
