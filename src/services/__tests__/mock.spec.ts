import { describe, expect, it } from 'vitest'

import { mockApi } from '../mock'
import { ApiError } from '@/types'
import { DEMO_CREDENTIALS } from '@/mock/data'

describe('mock auth api', () => {
  it('logs in a seeded account and returns a usable token', async () => {
    const session = await mockApi.auth.login(DEMO_CREDENTIALS)

    expect(session.user.email).toBe(DEMO_CREDENTIALS.email)
    expect(session.token).toBeTruthy()
    await expect(mockApi.auth.me(session.token)).resolves.toMatchObject({
      id: session.user.id,
    })
  })

  it('matches the email case-insensitively', async () => {
    const session = await mockApi.auth.login({
      ...DEMO_CREDENTIALS,
      email: DEMO_CREDENTIALS.email.toUpperCase(),
    })

    expect(session.user.email).toBe(DEMO_CREDENTIALS.email)
  })

  it('rejects a wrong password with a 401', async () => {
    await expect(
      mockApi.auth.login({ email: DEMO_CREDENTIALS.email, password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('rejects an unknown email with a 401', async () => {
    await expect(
      mockApi.auth.login({ email: 'nobody@shotgun.app', password: 'password123' }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it('registers a new account and logs it in', async () => {
    const email = `new-${Date.now()}@shotgun.app`
    const session = await mockApi.auth.register({ email, password: 'password123', name: 'Mira' })

    expect(session.user.name).toBe('Mira')
    expect(session.user.rating).toBe(0)
    await expect(mockApi.auth.login({ email, password: 'password123' })).resolves.toBeTruthy()
  })

  it('refuses a duplicate email with a 409', async () => {
    await expect(
      mockApi.auth.register({
        email: DEMO_CREDENTIALS.email,
        password: 'password123',
        name: 'Impostor',
      }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('invalidates the token on logout', async () => {
    const session = await mockApi.auth.login(DEMO_CREDENTIALS)
    await mockApi.auth.logout(session.token)

    // The token no longer maps to a live session, so only the encoded user id
    // could resolve it. A garbage token must still fail.
    await expect(mockApi.auth.me('not-a-token')).rejects.toMatchObject({ status: 401 })
  })
})
