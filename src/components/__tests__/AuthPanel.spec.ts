import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { getFakeResetToken, resetFakeApi } from '@/test/fakeApi'

import AuthPanel from '../AuthPanel.vue'
import { DEMO_CREDENTIALS } from '@/test/seed'

const blank = { template: '<div />' }

function mountPanel(router: Router) {
  return mount(AuthPanel, { global: { plugins: [router] } })
}

describe('AuthPanel', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'landing', component: blank },
        { path: '/app', name: 'app', component: blank },
      ],
    })
    await router.push('/')
    await router.isReady()
  })

  it('starts in login mode and hides the name field', () => {
    const wrapper = mountPanel(router)

    expect(wrapper.get('h2').text()).toBe('Welcome back')
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(false)
  })

  it('shows the name field after switching to register', async () => {
    const wrapper = mountPanel(router)

    await wrapper.get('form + p button').trigger('click')

    expect(wrapper.get('h2').text()).toBe('Create your account')
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(true)
  })

  it('requires a phone number to register', async () => {
    const wrapper = mountPanel(router)
    await wrapper.get('form + p button').trigger('click')
    await wrapper.get('input[autocomplete="name"]').setValue('No Phone')
    await wrapper.get('input[type="email"]').setValue('nophone@test.app')
    await wrapper.get('input[type="password"]').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="alert"]').text()).toBe('Enter your phone number.')
    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('switches back to login and clears a previous error', async () => {
    const wrapper = mountPanel(router)
    await wrapper.get('form + p button').trigger('click')
    await wrapper.get('input[autocomplete="name"]').setValue('New Person')
    await wrapper.get('input[type="email"]').setValue(DEMO_CREDENTIALS.email)
    await wrapper.get('input[type="tel"]').setValue('40 123 456')
    await wrapper.get('input[type="password"]').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await new Promise((resolve) => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain('already exists')

    await wrapper.get('form + p button').trigger('click')

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('h2').text()).toBe('Welcome back')
  })

  it('logs in and navigates to /app', async () => {
    const wrapper = mountPanel(router)

    await wrapper.get('input[type="email"]').setValue(DEMO_CREDENTIALS.email)
    await wrapper.get('input[type="password"]').setValue(DEMO_CREDENTIALS.password)
    await wrapper.get('form').trigger('submit')
    await new Promise((resolve) => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(router.currentRoute.value.name).toBe('app')
  })

  it('renders the API error and stays put on a bad password', async () => {
    const wrapper = mountPanel(router)

    await wrapper.get('input[type="email"]').setValue(DEMO_CREDENTIALS.email)
    await wrapper.get('input[type="password"]').setValue('wrong-password')
    await wrapper.get('form').trigger('submit')
    await new Promise((resolve) => setTimeout(resolve, 500))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="alert"]').text()).toBe('Wrong email or password.')
    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('offers a forgot password flow and returns to login', async () => {
    const wrapper = mountPanel(router)
    await wrapper.get('input[type="email"]').setValue(DEMO_CREDENTIALS.email)

    await wrapper.get('button[type="button"]:not([aria-label])').trigger('click')

    expect(wrapper.get('h2').text()).toBe('Forgot your password?')
    expect((wrapper.get('input[type="email"]').element as HTMLInputElement).value).toBe(
      DEMO_CREDENTIALS.email,
    )

    await wrapper.get('form').trigger('submit')
    await new Promise((resolve) => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="status"]').text()).toContain(DEMO_CREDENTIALS.email)
    expect(getFakeResetToken(DEMO_CREDENTIALS.email)).toBeDefined()

    const back = wrapper.findAll('button').find((b) => b.text() === 'Back to log in')!
    await back.trigger('click')
    expect(wrapper.get('h2').text()).toBe('Welcome back')
  })
})
