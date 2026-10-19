/**
 * Profile picture store: uploads and removes the signed-in user's picture on the profile page.
 * Kept apart from `auth.ts` so its errors do not show up in the profile and password forms.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { ApiError, type User } from '@/types'

export const useProfilePictureStore = defineStore('profilePicture', () => {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function run(fn: () => Promise<User>): Promise<boolean> {
    pending.value = true
    error.value = null
    try {
      const updated = await fn()
      const auth = useAuthStore()
      // A new upload keeps the same URL, so the version makes the browser load the new picture
      if (auth.user) {
        auth.user.avatarUrl = updated.avatarUrl ? `${updated.avatarUrl}?v=${Date.now()}` : null
      }
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
      return false
    } finally {
      pending.value = false
    }
  }

  const upload = (file: File) => run(() => api.auth.uploadProfilePicture(file))
  const remove = () => run(() => api.auth.deleteProfilePicture())

  return { pending, error, upload, remove }
})
