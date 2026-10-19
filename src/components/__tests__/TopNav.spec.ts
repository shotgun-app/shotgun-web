import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { resetFakeApi } from '@/test/fakeApi'
import TopNav from '../TopNav.vue'

const blank = { template: '<div />' }

describe('TopNav', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('links to the public sustainability impact page', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/app', name: 'app', component: blank },
        { path: '/sustainability-impact', name: 'sustainability-impact', component: blank },
      ],
    })
    await router.push('/app')

    const wrapper = mount(TopNav, { global: { plugins: [router] } })

    expect(wrapper.get('a[aria-label="Sustainability impact"]').attributes('href')).toBe(
      '/sustainability-impact',
    )
  })
})
