import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
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
})
