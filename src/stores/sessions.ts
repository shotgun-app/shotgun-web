/**
 * Sessions store: the devices the user is signed in on, listed on the profile page.
 * Kept apart from `auth.ts` so its errors do not show up in the profile and password forms.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { ApiError, type Session } from '@/types'

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref<Session[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    pending.value = true
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
      return null
    } finally {
      pending.value = false
    }
  }

  async function fetchAll(): Promise<void> {
    const list = await run(() => api.auth.listSessions())
    if (list) sessions.value = list
  }

  /** Ending the current session signs this browser out, so the caller leaves the app. */
  async function remove(session: Session): Promise<boolean> {
    await run(() => api.auth.deleteSession(session.id))
    if (error.value) return false
    sessions.value = sessions.value.filter((s) => s.id !== session.id)
    if (session.current) useAuthStore().clearSession()
    return true
  }

  return { sessions, pending, error, fetchAll, remove }
})
