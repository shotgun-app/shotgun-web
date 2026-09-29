import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { resetFakeApi } from '@/test/fakeApi'

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

  it('switches back to login and clears a previous error', async () => {
    const wrapper = mountPanel(router)
    await wrapper.get('form + p button').trigger('click')
    await wrapper.get('input[autocomplete="name"]').setValue('New Person')
    await wrapper.get('input[type="email"]').setValue(DEMO_CREDENTIALS.email)
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
})
