import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { api } from '@/services/api'
import { resetFakeApi, setFakeImpact } from '@/test/fakeApi'
import SustainabilityImpactView from '../SustainabilityImpactView.vue'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/test/seed'

const blank = { template: '<div />' }

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: blank },
      { path: '/app', name: 'app', component: blank },
      {
        path: '/sustainability-impact',
        name: 'sustainability-impact',
        component: SustainabilityImpactView,
      },
    ],
  })
}

async function mountImpactView(router = createTestRouter()) {
  const wrapper = mount(SustainabilityImpactView, {
    global: {
      plugins: [router],
    },
  })
  await flushPromises()
  return wrapper
}

describe('SustainabilityImpactView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('renders heading, 3 highlights and community impact metrics from live data', async () => {
    setFakeImpact({
      co2ConsumedKg: 42.5,
      co2WouldHaveBeenConsumedKg: 150.0,
      co2SavedKg: 107.5,
      totalCompletedRides: 5,
      totalSharedRides: 4,
      totalPassengers: 12,
      individualRidesSaved: 12,
      driversWithoutShotgun: 17,
      totalDistanceKm: 1250,
    })

    const wrapper = await mountImpactView()

    // Title and lead
    expect(wrapper.get('h1').text()).toBe('Sustainability Impact')

    // 3 Carbon Highlights
    expect(wrapper.text()).toContain('CO₂ Consumed')
    expect(wrapper.text()).toContain('42.5 kg CO₂')

    expect(wrapper.text()).toContain('Without Shotgun')
    expect(wrapper.text()).toContain('150 kg CO₂')

    expect(wrapper.text()).toContain('Total CO₂ Saved')
    expect(wrapper.text()).toContain('107.5 kg CO₂')

    // Community impact numbers
    expect(wrapper.text()).toContain('Completed Rides')
    expect(wrapper.text()).toContain('5')

    expect(wrapper.text()).toContain('Passengers Shared')
    expect(wrapper.text()).toContain('12')

    expect(wrapper.text()).toContain('Individual Rides Saved')

    expect(wrapper.text()).toContain('Drivers Without Shotgun')
    expect(wrapper.text()).toContain('17')
  })

  it('renders zero / empty values gracefully when no rides are completed yet', async () => {
    setFakeImpact({
      co2ConsumedKg: 0,
      co2WouldHaveBeenConsumedKg: 0,
      co2SavedKg: 0,
      totalCompletedRides: 0,
      totalSharedRides: 0,
      totalPassengers: 0,
      individualRidesSaved: 0,
      driversWithoutShotgun: 0,
      totalDistanceKm: 0,
    })

    const wrapper = await mountImpactView()

    expect(wrapper.text()).toContain('0 kg CO₂')
    expect(wrapper.text()).toContain('Methodology & Baseline Assumptions')
  })

  it('shows only the error, not zeroed metrics, when the first load fails', async () => {
    vi.spyOn(api.impact, 'get').mockRejectedValueOnce(new Error('offline'))

    const wrapper = await mountImpactView()

    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to load impact metrics.')
    expect(wrapper.text()).not.toContain('Total CO₂ Saved')
  })

  it('adapts the back button for guests vs authenticated users', async () => {
    // Guest
    const guestWrapper = await mountImpactView()
    expect(guestWrapper.get('header a[aria-label="Back"]').text()).toContain('Back to Home')

    // Logged in user
    await useAuthStore().login(DEMO_CREDENTIALS)
    const userWrapper = await mountImpactView()
    expect(userWrapper.get('header a[aria-label="Back"]').text()).toContain('Back to App')
  })
})
