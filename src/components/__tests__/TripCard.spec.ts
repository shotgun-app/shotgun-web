import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

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
