import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetFakeApi } from '@/test/fakeApi'

import router from '../index'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/test/seed'

describe('router guards', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()
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

  it('protects the rides route too', async () => {
    await router.push('/app/rides')

    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('lets an authenticated user into /app/rides', async () => {
    await useAuthStore().login(DEMO_CREDENTIALS)

    await router.push('/app/rides')

    expect(router.currentRoute.value.name).toBe('rides')
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

  it('protects user profiles', async () => {
    await router.push('/app/users/usr_2')

    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('sends a user opening their own public profile to /app/profile', async () => {
    await useAuthStore().login(DEMO_CREDENTIALS)

    await router.push('/app/users/usr_1')

    expect(router.currentRoute.value.name).toBe('profile')
  })

  it('redirects unknown paths to the landing page', async () => {
    await router.push('/does-not-exist')

    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('serves the reset page to guests and to logged-in users', async () => {
    await router.push('/reset-password?token=abc')
    expect(router.currentRoute.value.name).toBe('reset-password')

    await useAuthStore().login(DEMO_CREDENTIALS)
    await router.push('/reset-password?token=abc')
    expect(router.currentRoute.value.name).toBe('reset-password')
  })
})
