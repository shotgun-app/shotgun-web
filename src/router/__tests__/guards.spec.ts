import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import router from '../index'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/mock/data'

describe('router guards', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    await router.replace('/')
    await router.isReady()
  })

  it('sends an unauthenticated visitor from /app back to the landing page', async () => {
    await router.push('/app')

    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('also protects nested app routes', async () => {
    await router.push('/app/profile')

    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('lets an authenticated user into /app', async () => {
    await useAuthStore().login(DEMO_CREDENTIALS)

    await router.push('/app')

    expect(router.currentRoute.value.name).toBe('app')
  })

  it('keeps an authenticated user off the landing page', async () => {
    await useAuthStore().login(DEMO_CREDENTIALS)
    await router.push('/app')

    await router.push('/')

    expect(router.currentRoute.value.name).toBe('app')
  })

  it('redirects unknown paths to the landing page', async () => {
    await router.push('/does-not-exist')

    expect(router.currentRoute.value.name).toBe('landing')
  })
})
