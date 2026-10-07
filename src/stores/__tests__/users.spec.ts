import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetFakeApi } from '@/test/fakeApi'
import { useAuthStore } from '../auth'
import { useUsersStore } from '../users'
import { DEMO_CREDENTIALS } from '@/test/seed'

describe('users store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()
    await useAuthStore().login(DEMO_CREDENTIALS)
  })

  it('loads another user', async () => {
    const users = useUsersStore()

    await users.load('usr_2')

    expect(users.user?.user.name).toBe('Ben Foster')
    expect(users.error).toBeNull()
  })

  it('reports an unknown user', async () => {
    const users = useUsersStore()
    await users.load('usr_2')

    await users.load('usr_missing')

    expect(users.user).toBeNull()
    expect(users.error).toBe('User not found.')
  })
})
