import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, RouterLinkStub } from '@vue/test-utils'

import TripCard from '../TripCard.vue'
import type { TripWithDriver } from '@/types'

function makeTrip(overrides: Partial<TripWithDriver> = {}): TripWithDriver {
  return {
    id: 'trip_1',
    driverId: 'usr_2',
    originCity: 'Ljubljana',
    originCountry: 'Slovenia',
    destinationCity: 'Zagreb',
    destinationCountry: 'Croatia',
    departureAt: '2099-01-01T09:00:00Z',
    seatsTotal: 3,
    seatsBooked: 0,
    smallBagsTotal: 2,
    smallBagsBooked: 0,
    largeBagsTotal: 1,
    largeBagsBooked: 0,
    pricePerSeat: 10,
    currency: 'EUR',
    notes: '',
    createdAt: '2026-01-01T00:00:00Z',
    driver: { id: 'usr_2', name: 'Ben', joinedAt: '2026-01-01T00:00:00Z' },
    ...overrides,
  }
}

const stubs = { 'router-link': true }

describe('TripCard.vue bags', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows what bag space is left', () => {
    const wrapper = mount(TripCard, {
      props: { trip: makeTrip({ smallBagsBooked: 1 }) },
      global: { stubs },
    })
    expect(wrapper.get('#trip-card-bags-trip_1').text()).toBe('Bags left: 1 small, 1 large')
  })

  it('flags a ride whose bag space is used up, but still lets you book seats', () => {
    const wrapper = mount(TripCard, {
      props: { trip: makeTrip({ smallBagsBooked: 2, largeBagsBooked: 1 }) },
      global: { stubs },
    })
    expect(wrapper.get('#trip-card-bags-trip_1').text()).toBe('Bag space full')
    expect(wrapper.get('#trip-card-book-btn').attributes('disabled')).toBeUndefined()
  })

  it('says so when the driver offers no bag space', () => {
    const wrapper = mount(TripCard, {
      props: { trip: makeTrip({ smallBagsTotal: 0, largeBagsTotal: 0 }) },
      global: { stubs },
    })
    expect(wrapper.get('#trip-card-bags-trip_1').text()).toBe('No bag space')
  })

  it('only offers steppers for sizes that still have space', async () => {
    const wrapper = mount(TripCard, {
      props: { trip: makeTrip({ largeBagsBooked: 1 }) },
      global: { stubs },
    })
    await wrapper.get('#trip-card-book-btn').trigger('click')
    expect(wrapper.find('#trip-card-small-bags-input').exists()).toBe(true)
    expect(wrapper.find('#trip-card-large-bags-input').exists()).toBe(false)
  })
})

describe('TripCard.vue environmental impact', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows distance when distanceKm is provided', () => {
    const wrapper = mount(TripCard, {
      props: { trip: makeTrip({ distanceKm: 580 }) },
      global: { stubs },
    })
    expect(wrapper.get('#trip-card-distance-trip_1').text()).toBe('580 km')
  })

  it('displays zero emissions and savings for electric rides', () => {
    const wrapper = mount(TripCard, {
      props: {
        trip: makeTrip({
          distanceKm: 500,
          isElectric: true,
          co2ConsumedKg: 0,
          co2SavedKg: 60,
        }),
      },
      global: { stubs },
    })
    expect(wrapper.get('#trip-card-eco-trip_1').text()).toContain('0 kg CO₂ (Electric)')
    expect(wrapper.get('#trip-card-saved-trip_1').text()).toBe('Saves ~60 kg CO₂ vs driving alone')
  })

  it('displays CO2 consumed and savings for combustion rides', () => {
    const wrapper = mount(TripCard, {
      props: {
        trip: makeTrip({
          distanceKm: 100,
          co2ConsumedKg: 14.2,
          co2SavedKg: 4.9,
        }),
      },
      global: { stubs },
    })
    expect(wrapper.get('#trip-card-eco-trip_1').text()).toContain('14.2 kg CO₂')
    expect(wrapper.get('#trip-card-saved-trip_1').text()).toBe('Saves ~4.9 kg CO₂ vs driving alone')
  })

  it('hides eco section when no eco info or distance is available', () => {
    const wrapper = mount(TripCard, {
      props: { trip: makeTrip() },
      global: { stubs },
    })
    expect(wrapper.find('#trip-card-eco-trip_1').exists()).toBe(false)
    expect(wrapper.find('#trip-card-distance-trip_1').exists()).toBe(false)
  })
})

describe('TripCard.vue driver', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("links the driver's name to their profile", () => {
    const wrapper = mount(TripCard, {
      props: { trip: makeTrip() },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    const link = wrapper.getComponent<typeof RouterLinkStub>('#trip-card-driver-trip_1')

    expect(link.props('to')).toEqual({ name: 'user', params: { id: 'usr_2' } })
    expect(link.text()).toBe('Ben')
  })
})
