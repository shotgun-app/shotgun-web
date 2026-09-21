import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import AuthPanel from '../AuthPanel.vue'
import { DEMO_CREDENTIALS } from '@/mock/data'

const blank = { template: '<div />' }

function mountPanel(router: Router) {
  return mount(AuthPanel, { global: { plugins: [router] } })
}

describe('AuthPanel', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
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

  it('starts on the login tab and hides the name field', () => {
    const wrapper = mountPanel(router)

    expect(wrapper.get('h2').text()).toBe('Log in')
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(false)
  })

  it('shows the name field after switching to register', async () => {
    const wrapper = mountPanel(router)

    const [, registerTab] = wrapper.findAll('[role="tab"]')
    await registerTab!.trigger('click')

    expect(wrapper.get('h2').text()).toBe('Create your account')
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(true)
  })

  it('logs in with the demo account and navigates to /app', async () => {
    const wrapper = mountPanel(router)

    await wrapper.get('button[type="button"]:last-of-type').trigger('click')
    await wrapper.get('form').trigger('submit')
    await new Promise((resolve) => setTimeout(resolve, 500))
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
