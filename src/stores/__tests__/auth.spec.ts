import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getFakeResetToken, resetFakeApi } from '@/test/fakeApi'

import { useAuthStore } from '../auth'
import { api } from '@/services/api'
import { DEMO_CREDENTIALS } from '@/test/seed'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('logs in and exposes the user', async () => {
    const auth = useAuthStore()

    expect(await auth.login(DEMO_CREDENTIALS)).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.email).toBe(DEMO_CREDENTIALS.email)
  })

  it('rejects a wrong password and keeps the user logged out', async () => {
    const auth = useAuthStore()

    expect(await auth.login({ email: DEMO_CREDENTIALS.email, password: 'nope' })).toBe(false)
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.error).toBe('Wrong email or password.')
  })

  it('clears the user on logout', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)

    await auth.logout()

    expect(auth.isAuthenticated).toBe(false)
  })
})

describe('auth store session restore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('restores the user from the session cookie once', async () => {
    await api.auth.login(DEMO_CREDENTIALS)
    const auth = useAuthStore()

    await auth.restore()

    expect(auth.user?.email).toBe(DEMO_CREDENTIALS.email)
  })

  it('stays logged out without a session and shows no error', async () => {
    const auth = useAuthStore()

    await auth.restore()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.error).toBeNull()
  })
})

describe('auth store password reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('succeeds for unknown emails too, without creating a token', async () => {
    const auth = useAuthStore()

    expect(await auth.requestPasswordReset('nobody@shotgun.app')).toBe(true)
    expect(getFakeResetToken('nobody@shotgun.app')).toBeUndefined()
  })

  it('resets the password with the emailed token, once', async () => {
    const auth = useAuthStore()
    await auth.requestPasswordReset(DEMO_CREDENTIALS.email)
    const token = getFakeResetToken(DEMO_CREDENTIALS.email)!

    expect(await auth.resetPassword({ token, password: 'brand-new-pass' })).toBe(true)
    expect(await auth.login({ email: DEMO_CREDENTIALS.email, password: 'brand-new-pass' })).toBe(
      true,
    )

    expect(await auth.resetPassword({ token, password: 'another-pass-1' })).toBe(false)
    expect(auth.error).toBe('This reset link is invalid or has expired.')
  })

  it('reports a bad token as an error string', async () => {
    const auth = useAuthStore()

    expect(await auth.resetPassword({ token: 'nope', password: 'brand-new-pass' })).toBe(false)
    expect(auth.error).toBe('This reset link is invalid or has expired.')
  })
})
