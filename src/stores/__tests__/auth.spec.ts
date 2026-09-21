import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '../auth'
import { DEMO_CREDENTIALS } from '@/mock/data'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('logs in with the seeded demo account', async () => {
    const auth = useAuthStore()

    expect(await auth.login(DEMO_CREDENTIALS)).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.email).toBe(DEMO_CREDENTIALS.email)
    expect(localStorage.getItem('shotgun.token')).toBe(auth.token)
  })

  it('rejects a wrong password and keeps the user logged out', async () => {
    const auth = useAuthStore()

    expect(await auth.login({ email: DEMO_CREDENTIALS.email, password: 'nope' })).toBe(false)
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.error).toBe('Wrong email or password.')
  })

  it('clears the session on logout', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)

    await auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('shotgun.token')).toBeNull()
  })
})
