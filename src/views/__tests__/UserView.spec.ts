import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { api } from '@/services/api'
import { resetFakeApi } from '@/test/fakeApi'
import UserView from '../UserView.vue'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/test/seed'

async function mountUser(id: string) {
  const wrapper = mount(UserView, { props: { id } })
  await flushPromises()
  return wrapper
}

describe('UserView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()
    await useAuthStore().login(DEMO_CREDENTIALS)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the profile without any edit controls', async () => {
    const wrapper = await mountUser('usr_2')

    expect(wrapper.get('h1').text()).toBe('Ben Foster')
    expect(wrapper.text()).toContain('ben@shotgun.app')
    expect(wrapper.text()).toContain('Member since')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows an error for an unknown user', async () => {
    const wrapper = await mountUser('usr_missing')

    expect(wrapper.get('[role="alert"]').text()).toBe('User not found.')
  })

  it('shows the CO₂ a passenger saved and how many rides they were on', async () => {
    const get = api.users.get.bind(api.users)
    vi.spyOn(api.users, 'get').mockImplementation(async (id) => ({
      ...(await get(id)),
      passengerImpact: { rides: 3, co2SavedKg: 42.36 },
    }))

    const wrapper = await mountUser('usr_2')
    const card = wrapper.get('#user-passenger-impact')

    expect(card.get('[data-test="impact-co2"]').text()).toBe('42.4 kg CO₂')
    expect(card.get('[data-test="impact-rides"]').text()).toBe('3')
  })

  it('shows zero impact for a user with no completed rides', async () => {
    const wrapper = await mountUser('usr_2')
    const card = wrapper.get('#user-passenger-impact')

    expect(card.get('[data-test="impact-co2"]').text()).toBe('0 kg CO₂')
    expect(card.get('[data-test="impact-rides"]').text()).toBe('0')
  })

  // TODO(driver impact): add the same two cases for the driver impact card
})
