import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { api } from '@/services/api'
import { getFakeResetToken, resetFakeApi } from '@/test/fakeApi'
import { DEMO_CREDENTIALS } from '@/test/seed'

import ResetPasswordPanel from '../ResetPasswordPanel.vue'

const blank = { template: '<div />' }

async function mountAt(url: string) {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: blank },
      { path: '/reset-password', name: 'reset-password', component: blank },
    ],
  })
  await router.push(url)
  await router.isReady()
  return mount(ResetPasswordPanel, { global: { plugins: [router] } })
}

async function settle(wrapper: ReturnType<typeof mount>) {
  await new Promise((resolve) => setTimeout(resolve, 50))
  await wrapper.vm.$nextTick()
}

describe('ResetPasswordPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('shows an error and no form when the token is missing', async () => {
    const wrapper = await mountAt('/reset-password')
    await settle(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toContain('invalid or has expired')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('sets the new password with the token from the URL', async () => {
    await api.auth.requestPasswordReset(DEMO_CREDENTIALS.email)
    const token = getFakeResetToken(DEMO_CREDENTIALS.email)
    const wrapper = await mountAt(`/reset-password?token=${token}`)
    await settle(wrapper)

    await wrapper.get('input[type="password"]').setValue('brand-new-pass')
    await wrapper.get('form').trigger('submit')
    await settle(wrapper)

    expect(wrapper.get('h2').text()).toBe('Password updated')
    await expect(
      api.auth.login({ email: DEMO_CREDENTIALS.email, password: 'brand-new-pass' }),
    ).resolves.toBeDefined()
  })

  it('never shows the form for a token the API does not know', async () => {
    const wrapper = await mountAt('/reset-password?token=d')
    await settle(wrapper)

    expect(wrapper.get('h2').text()).toBe('Link not valid')
    expect(wrapper.get('[role="alert"]').text()).toContain('invalid or has expired')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
  })

  it('renders the API error when the token dies after the page loaded', async () => {
    await api.auth.requestPasswordReset(DEMO_CREDENTIALS.email)
    const token = getFakeResetToken(DEMO_CREDENTIALS.email)!
    const wrapper = await mountAt(`/reset-password?token=${token}`)
    await settle(wrapper)
    await api.auth.resetPassword({ token, password: 'used-elsewhere1' })

    await wrapper.get('input[type="password"]').setValue('brand-new-pass')
    await wrapper.get('form').trigger('submit')
    await settle(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe('This reset link is invalid or has expired.')
  })
})
