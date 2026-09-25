import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import BookingsView from '../BookingsView.vue'
import { useAuthStore } from '@/stores/auth'
import { useBookingsStore } from '@/stores/bookings'
import { api } from '@/services/api'
import { MOCK_TRIPS } from '@/mock/data'

const blank = { template: '<div />' }

function buildRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: blank },
      { path: '/app', name: 'app', component: blank },
      { path: '/app/bookings', name: 'bookings', component: blank },
    ],
  })
}

async function mountBookings(router: Router) {
  const wrapper = mount(BookingsView, {
    global: { plugins: [router] },
  })
  await wrapper.vm.$nextTick()
  // Wait for the mock's initial fetchMine() delay.
  await new Promise((r) => setTimeout(r, 500))
  await wrapper.vm.$nextTick()
  return wrapper
}

/**
 * Registers a fresh passenger account to avoid polluting the shared module-level
 * `bookings` array with other tests' data.
 */
async function freshPassenger() {
  const auth = useAuthStore()
  await auth.register({
    name: 'Test Passenger',
    email: `passenger-${Date.now()}-${Math.random().toString(36).slice(2)}@test.app`,
    password: 'password123',
  })
  return auth
}

/**
 * Creates a fresh driver + trip with the requested seat count, then returns the trip id.
 * Using fresh trips ensures no cross-test contamination of seatsBooked.
 */
async function freshTrip(seatsTotal: number): Promise<string> {
  const session = await api.auth.register({
    name: 'Test Driver',
    email: `driver-${Date.now()}-${Math.random().toString(36).slice(2)}@test.app`,
    password: 'password123',
  })
  const trip = await api.trips.create(session.token, {
    origin: 'Berlin',
    destination: 'Munich',
    departureAt: '2030-01-01T09:00:00Z',
    seatsTotal,
  })
  return trip.id
}

describe('BookingsView', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()

    router = buildRouter()
    await router.push('/app/bookings')
    await router.isReady()

    await freshPassenger()
  })

  it('shows the empty state and a link to the search page', async () => {
    const wrapper = await mountBookings(router)

    expect(wrapper.find('#bookings-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('You have no bookings yet.')
    expect(wrapper.text()).toContain('Search for a ride')
  })

  it('shows a confirmed booking after creation', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(3)
    await bookingsStore.create(tripId, { seats: 1 })

    const wrapper = await mountBookings(router)

    expect(wrapper.find('#bookings-empty').exists()).toBe(false)
    expect(wrapper.text()).toContain('Berlin')
    expect(wrapper.text()).toContain('Munich')
    expect(wrapper.text()).toContain('1 seat booked')
  })

  it('shows plural "seats" when more than 1 seat is booked', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(4)
    await bookingsStore.create(tripId, { seats: 2 })

    const wrapper = await mountBookings(router)

    expect(wrapper.text()).toContain('2 seats booked')
  })

  it('shows "Change seats" and "Cancel booking" buttons in view mode', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(2)
    await bookingsStore.create(tripId, { seats: 1 })
    await bookingsStore.fetchMine()
    const bookingId = bookingsStore.bookings[0]!.id

    const wrapper = await mountBookings(router)

    expect(wrapper.find(`#booking-edit-btn-${bookingId}`).exists()).toBe(true)
    expect(wrapper.find(`#booking-cancel-btn-${bookingId}`).exists()).toBe(true)
  })

  it('opens the edit form with the current seat count pre-filled', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(4)
    await bookingsStore.create(tripId, { seats: 2 })
    await bookingsStore.fetchMine()
    const bookingId = bookingsStore.bookings[0]!.id

    const wrapper = await mountBookings(router)

    await wrapper.find(`#booking-edit-btn-${bookingId}`).trigger('click')
    await wrapper.vm.$nextTick()

    const input = wrapper.find<HTMLInputElement>(`#booking-edit-seats-${bookingId}`)
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('2')
  })

  it('saves a seat-count change and updates the store', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(4)
    await bookingsStore.create(tripId, { seats: 1 })
    await bookingsStore.fetchMine()
    const bookingId = bookingsStore.bookings[0]!.id

    const wrapper = await mountBookings(router)

    await wrapper.find(`#booking-edit-btn-${bookingId}`).trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find(`#booking-edit-seats-${bookingId}`).setValue(2)
    await wrapper.find(`#booking-edit-form-${bookingId}`).trigger('submit')
    await new Promise((r) => setTimeout(r, 500))
    await wrapper.vm.$nextTick()

    // Edit form is closed
    expect(wrapper.find(`#booking-edit-form-${bookingId}`).exists()).toBe(false)
    // Store reflects new count
    expect(bookingsStore.bookings.find((b) => b.id === bookingId)?.seats).toBe(2)
  })

  it('cancel button reveals confirmation; "Keep booking" hides it', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(2)
    await bookingsStore.create(tripId, { seats: 1 })
    await bookingsStore.fetchMine()
    const bookingId = bookingsStore.bookings[0]!.id

    const wrapper = await mountBookings(router)

    await wrapper.find(`#booking-cancel-btn-${bookingId}`).trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find(`#booking-cancel-confirm-btn-${bookingId}`).exists()).toBe(true)

    await wrapper.find(`#booking-cancel-dismiss-btn-${bookingId}`).trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find(`#booking-cancel-confirm-btn-${bookingId}`).exists()).toBe(false)
    expect(wrapper.find(`#booking-cancel-btn-${bookingId}`).exists()).toBe(true)
  })

  it('confirming cancellation removes the booking from the list', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(2)
    await bookingsStore.create(tripId, { seats: 1 })
    await bookingsStore.fetchMine()
    const bookingId = bookingsStore.bookings[0]!.id

    const wrapper = await mountBookings(router)

    await wrapper.find(`#booking-cancel-btn-${bookingId}`).trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find(`#booking-cancel-confirm-btn-${bookingId}`).trigger('click')
    await new Promise((r) => setTimeout(r, 500))
    await wrapper.vm.$nextTick()

    expect(bookingsStore.bookings.find((b) => b.id === bookingId)).toBeUndefined()
    expect(wrapper.find('#bookings-empty').exists()).toBe(true)
  })

  it('shows multiple bookings sorted soonest-departing first', async () => {
    const auth = useAuthStore()
    // Create two trips with different departure times (sooner and later).
    const soonerSession = await api.auth.register({
      name: 'Driver Sooner',
      email: `driver-sooner-${Date.now()}@test.app`,
      password: 'password123',
    })
    const laterSession = await api.auth.register({
      name: 'Driver Later',
      email: `driver-later-${Date.now()}@test.app`,
      password: 'password123',
    })
    const tripSooner = await api.trips.create(soonerSession.token, {
      origin: 'Paris',
      destination: 'Lyon',
      departureAt: '2030-06-01T08:00:00Z',
      seatsTotal: 3,
    })
    const tripLater = await api.trips.create(laterSession.token, {
      origin: 'Lyon',
      destination: 'Nice',
      departureAt: '2030-06-15T10:00:00Z',
      seatsTotal: 3,
    })
    // Book the later trip first, then the sooner trip.
    await api.bookings.create(auth.token!, tripLater.id, { seats: 1 })
    await api.bookings.create(auth.token!, tripSooner.id, { seats: 1 })

    const wrapper = await mountBookings(router)

    const cards = wrapper.findAll('[id^="booking-card-"]')
    expect(cards.length).toBe(2)
    // The sooner trip should appear before the later trip in the DOM.
    const texts = cards.map((c) => c.text())
    expect(texts[0]).toContain('Paris')
    expect(texts[1]).toContain('Lyon') // Lyon → Nice is the later trip
  })
})

// ── Bookings store unit tests ─────────────────────────────────────────────────

describe('bookings store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    await freshPassenger()
  })

  it('books a seat and decrements the trip free seats', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(3)
    const tripRow = MOCK_TRIPS.find((t) => t.id === tripId)!
    const bookedBefore = tripRow.seatsBooked

    await bookingsStore.create(tripId, { seats: 1 })

    expect(bookingsStore.bookings.length).toBe(1)
    expect(tripRow.seatsBooked).toBe(bookedBefore + 1)
  })

  it('returns null and sets error when no seats are left', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(1)

    // Fill the only seat.
    await bookingsStore.create(tripId, { seats: 1 })

    // Try to book from a second fresh passenger.
    setActivePinia(createPinia())
    await freshPassenger()
    const freshStore = useBookingsStore()
    const result = await freshStore.create(tripId, { seats: 1 })

    expect(result).toBeNull()
    expect(freshStore.error).toBeTruthy()
  })

  it('prevents a second active booking on the same trip', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(3)
    await bookingsStore.create(tripId, { seats: 1 })

    // Try to book again on the same trip with the same passenger.
    const second = await bookingsStore.create(tripId, { seats: 1 })
    expect(second).toBeNull()
    expect(bookingsStore.error).toBeTruthy()
  })

  it('updates the seat count and adjusts seatsBooked on the trip', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(4)
    await bookingsStore.create(tripId, { seats: 1 })
    await bookingsStore.fetchMine()
    const bookingId = bookingsStore.bookings[0]!.id

    const tripRow = MOCK_TRIPS.find((t) => t.id === tripId)!
    const bookedBefore = tripRow.seatsBooked

    const ok = await bookingsStore.update(bookingId, { seats: 2 })

    expect(ok).toBe(true)
    expect(bookingsStore.bookings[0]!.seats).toBe(2)
    expect(tripRow.seatsBooked).toBe(bookedBefore + 1)
  })

  it('cancels a booking and restores seats to the trip', async () => {
    const bookingsStore = useBookingsStore()
    const tripId = await freshTrip(3)
    await bookingsStore.create(tripId, { seats: 1 })
    await bookingsStore.fetchMine()
    const bookingId = bookingsStore.bookings[0]!.id

    const tripRow = MOCK_TRIPS.find((t) => t.id === tripId)!
    const bookedBefore = tripRow.seatsBooked

    const ok = await bookingsStore.cancel(bookingId)

    expect(ok).toBe(true)
    expect(bookingsStore.bookings.find((b) => b.id === bookingId)).toBeUndefined()
    expect(tripRow.seatsBooked).toBe(bookedBefore - 1)
  })

  it('listMine returns bookings sorted soonest-departing first', async () => {
    const auth = useAuthStore()
    const soonerSession = await api.auth.register({
      name: 'Driver A',
      email: `driver-a-${Date.now()}@test.app`,
      password: 'password123',
    })
    const laterSession = await api.auth.register({
      name: 'Driver B',
      email: `driver-b-${Date.now()}@test.app`,
      password: 'password123',
    })
    const tripSooner = await api.trips.create(soonerSession.token, {
      origin: 'A',
      destination: 'B',
      departureAt: '2030-01-01T08:00:00Z',
      seatsTotal: 3,
    })
    const tripLater = await api.trips.create(laterSession.token, {
      origin: 'C',
      destination: 'D',
      departureAt: '2030-06-01T08:00:00Z',
      seatsTotal: 3,
    })
    // Book later first, then sooner.
    await api.bookings.create(auth.token!, tripLater.id, { seats: 1 })
    await api.bookings.create(auth.token!, tripSooner.id, { seats: 1 })

    const list = await api.bookings.listMine(auth.token!)

    const departures = list.map((b) => b.trip.departureAt)
    expect(departures).toEqual([...departures].sort())
  })
})
