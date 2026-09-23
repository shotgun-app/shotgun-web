import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import RidesView from '../RidesView.vue'
import { useAuthStore } from '@/stores/auth'
import { useRidesStore } from '@/stores/rides'

const blank = { template: '<div />' }

function buildRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: blank },
      { path: '/app', name: 'app', component: blank },
      { path: '/app/rides', name: 'rides', component: blank },
    ],
  })
}

async function mountRides(router: Router) {
  const wrapper = mount(RidesView, {
    global: { plugins: [router] },
  })
  await wrapper.vm.$nextTick()
  // Wait for the mock's initial fetchMine() delay.
  await new Promise((r) => setTimeout(r, 500))
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('RidesView', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()

    router = buildRouter()
    await router.push('/app/rides')
    await router.isReady()

    // MOCK_TRIPS is a shared module-level array (not copied per test like accounts
    // are), so each test registers its own fresh driver to start from a clean list.
    const auth = useAuthStore()
    await auth.register({
      name: 'Test Driver',
      email: `driver-${Date.now()}-${Math.random().toString(36).slice(2)}@test.app`,
      password: 'password123',
    })
  })

  it('shows the empty state and an "Offer a ride" button', async () => {
    const wrapper = await mountRides(router)

    expect(wrapper.text()).toContain("You're not offering any rides yet.")
    expect(wrapper.find('#rides-offer-btn').exists()).toBe(true)
    expect(wrapper.find('#ride-form').exists()).toBe(false)
  })

  it('opens the create form and hides the offer button', async () => {
    const wrapper = await mountRides(router)

    await wrapper.find('#rides-offer-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#ride-form').exists()).toBe(true)
    expect(wrapper.find('#rides-offer-btn').exists()).toBe(false)
  })

  it('requires all fields before submitting', async () => {
    const wrapper = await mountRides(router)
    await wrapper.find('#rides-offer-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#ride-form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('All fields are required.')
  })

  it('rejects more than 15 free seats', async () => {
    const wrapper = await mountRides(router)
    await wrapper.find('#rides-offer-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#ride-form-from-country').setValue('Sweden')
    await wrapper.vm.$nextTick()
    await wrapper.find('#ride-form-from-city').setValue('Gothenburg')
    await wrapper.find('#ride-form-to-country').setValue('Sweden')
    await wrapper.vm.$nextTick()
    await wrapper.find('#ride-form-to-city').setValue('Malmö')
    await wrapper.find('#ride-form-date').setValue('2027-09-01')
    await wrapper.find('#ride-form-seats').setValue(16)

    await wrapper.find('#ride-form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain("Free seats can't be more than 15.")
  })

  it('creates a ride and shows it in the list', async () => {
    const wrapper = await mountRides(router)
    await wrapper.find('#rides-offer-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#ride-form-from-country').setValue('Sweden')
    await wrapper.vm.$nextTick()
    await wrapper.find('#ride-form-from-city').setValue('Gothenburg')
    await wrapper.find('#ride-form-to-country').setValue('Sweden')
    await wrapper.vm.$nextTick()
    await wrapper.find('#ride-form-to-city').setValue('Malmö')
    await wrapper.find('#ride-form-date').setValue('2027-09-01')
    await wrapper.find('#ride-form-seats').setValue(3)

    await wrapper.find('#ride-form').trigger('submit')
    await new Promise((r) => setTimeout(r, 500))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#ride-form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Gothenburg')
    expect(wrapper.text()).toContain('Malmö')

    const rides = useRidesStore()
    expect(rides.rides.length).toBe(1)
  })

  it('edits an existing ride', async () => {
    const rides = useRidesStore()
    await rides.create({
      origin: 'Berlin',
      destination: 'Munich',
      departureAt: '2027-10-01T09:00:00Z',
      seatsTotal: 2,
    })
    const rideId = rides.rides[0]!.id

    const wrapper = await mountRides(router)

    await wrapper.find(`#ride-edit-btn-${rideId}`).trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find<HTMLInputElement>('#ride-form-seats').element.value).toBe('2')

    await wrapper.find('#ride-form-seats').setValue(5)
    await wrapper.find('#ride-form').trigger('submit')
    await new Promise((r) => setTimeout(r, 500))
    await wrapper.vm.$nextTick()

    expect(rides.rides.find((r) => r.id === rideId)?.seatsTotal).toBe(5)
  })

  it('deletes a ride after confirming', async () => {
    const rides = useRidesStore()
    await rides.create({
      origin: 'Amsterdam',
      destination: 'Rotterdam',
      departureAt: '2027-11-01T09:00:00Z',
      seatsTotal: 2,
    })
    const rideId = rides.rides[0]!.id

    const wrapper = await mountRides(router)

    await wrapper.find(`#ride-delete-btn-${rideId}`).trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find(`#ride-delete-confirm-btn-${rideId}`).exists()).toBe(true)

    await wrapper.find(`#ride-delete-confirm-btn-${rideId}`).trigger('click')
    await new Promise((r) => setTimeout(r, 500))
    await wrapper.vm.$nextTick()

    expect(rides.rides.find((r) => r.id === rideId)).toBeUndefined()
    expect(wrapper.text()).toContain("You're not offering any rides yet.")
  })
})
