import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetFakeApi } from '@/test/fakeApi'
import { useAuthStore } from '../auth'
import { useSessionsStore } from '../sessions'
import { DEMO_CREDENTIALS } from '@/test/seed'

describe('sessions store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()

    // Two logins are two devices; the second one is this browser
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
    await auth.login(DEMO_CREDENTIALS)
  })

  it('lists every session and marks the current one', async () => {
    const sessions = useSessionsStore()
    await sessions.fetchAll()

    expect(sessions.sessions).toHaveLength(2)
    expect(sessions.sessions.map((s) => s.current)).toEqual([true, false])
    expect(sessions.sessions[0]?.userAgent).toBe(navigator.userAgent)
  })

  it('removes another session and stays signed in', async () => {
    const sessions = useSessionsStore()
    await sessions.fetchAll()
    const other = sessions.sessions[1]!

    expect(await sessions.remove(other)).toBe(true)
    expect(sessions.sessions).toHaveLength(1)
    expect(useAuthStore().user).not.toBeNull()
  })

  it('signs out when the current session is removed', async () => {
    const sessions = useSessionsStore()
    await sessions.fetchAll()
    const current = sessions.sessions[0]!

    expect(await sessions.remove(current)).toBe(true)
    expect(useAuthStore().user).toBeNull()
  })

  it('reports a failed removal as an error string', async () => {
    const sessions = useSessionsStore()
    await sessions.fetchAll()
    const other = sessions.sessions[1]!
    await sessions.remove(other)

    expect(await sessions.remove(other)).toBe(false)
    expect(sessions.error).toBe('Session not found.')
    expect(sessions.sessions).toHaveLength(1)
  })
})
