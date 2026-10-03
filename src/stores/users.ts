/** Public profiles of other users, backed by `api.users`. */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { ApiError, type User } from '@/types'

export const useUsersStore = defineStore('users', () => {
  const user = ref<User | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function load(userId: string): Promise<void> {
    user.value = null
    pending.value = true
    error.value = null
    try {
      user.value = await api.users.get(userId)
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
    } finally {
      pending.value = false
    }
  }

  return { user, pending, error, load }
})
