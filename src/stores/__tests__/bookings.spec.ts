import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetFakeApi } from '@/test/fakeApi'
import { useAuthStore } from '../auth'
import { useBookingsStore } from '../bookings'
import { api } from '@/services/api'
import { DEMO_CREDENTIALS } from '@/test/seed'

describe('bookings store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()

    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
  })

  it('creates, lists, updates, and cancels bookings', async () => {
    const auth = useAuthStore()
    const bookings = useBookingsStore()

    // 1. Create a trip as a driver
    await api.auth.register({
      name: 'Driver Bob',
      email: 'bob@shotgun.app',
      password: 'password123',
      phone: '+38640999999',
    })
    const trip = await api.trips.create({
      originCity: 'Gothenburg',
      originCountry: 'Sweden',
      destinationCity: 'Stockholm',
      destinationCountry: 'Sweden',
      departureAt: '2027-05-01T08:00:00Z',
      seatsTotal: 4,
      pricePerSeat: 20,
    })

    // Log back in as passenger
    await auth.login(DEMO_CREDENTIALS)

    // Initially 0 bookings
    await bookings.fetchMine()
    expect(bookings.bookings.length).toBe(0)

    // 2. Book 2 seats
    const b = await bookings.create(trip.id, { seats: 2 })
    expect(b).not.toBeNull()
    expect(b?.seats).toBe(2)
    expect(bookings.bookings.length).toBe(1)
    expect(bookings.bookings[0]?.seats).toBe(2)

    // 3. Update seats to 3
    const updated = await bookings.update(b!.id, { seats: 3 })
    expect(updated).toBe(true)
    expect(bookings.bookings[0]?.seats).toBe(3)

    // 4. Cancel booking
    const cancelled = await bookings.cancel(b!.id)
    expect(cancelled).toBe(true)
    expect(bookings.bookings.length).toBe(0)
  })

  it('lists the driver and passengers of each booked trip', async () => {
    const auth = useAuthStore()
    const bookings = useBookingsStore()

    await api.auth.login({ email: 'ben@shotgun.app', password: 'password123' })
    const trip = await api.trips.create({
      originCity: 'Ljubljana',
      originCountry: 'Slovenia',
      destinationCity: 'Zagreb',
      destinationCountry: 'Croatia',
      departureAt: '2027-05-01T08:00:00Z',
      seatsTotal: 3,
      pricePerSeat: 0,
    })
    await api.auth.login({ email: 'clara@shotgun.app', password: 'password123' })
    await api.bookings.create(trip.id, { seats: 1 })

    await auth.login(DEMO_CREDENTIALS)
    await bookings.create(trip.id, { seats: 1 })

    const booked = bookings.bookings[0]!.trip
    expect(booked.driver.name).toBe('Ben Foster')
    expect(booked.driver).not.toHaveProperty('email')
    expect(booked.passengers.map((p) => p.name)).toEqual(['Clara Lindqvist', 'Alice'])
  })
})
