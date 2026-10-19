import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetFakeApi } from '@/test/fakeApi'

import { useAuthStore } from '../auth'
import { useProfilePictureStore } from '../profilePicture'
import { DEMO_CREDENTIALS } from '@/test/seed'

const png = () => new File(['png'], 'me.png', { type: 'image/png' })

describe('profile picture store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('uploads a picture and shows it on the user', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)

    expect(await useProfilePictureStore().upload(png())).toBe(true)
    expect(auth.user?.avatarUrl).toMatch(/^\/api\/images\/profile\/.+\.png\?v=\d+$/)
  })

  it('removes the picture', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
    const picture = useProfilePictureStore()
    await picture.upload(png())

    expect(await picture.remove()).toBe(true)
    expect(auth.user?.avatarUrl).toBeNull()
  })

  it('rejects a file that is not an image and leaves auth errors alone', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
    const picture = useProfilePictureStore()

    expect(await picture.upload(new File(['hi'], 'notes.txt', { type: 'text/plain' }))).toBe(false)
    expect(picture.error).toBe('Picture must be a JPEG, PNG or WebP image.')
    expect(auth.user?.avatarUrl).toBeNull()
    expect(auth.error).toBeNull()
  })
})
