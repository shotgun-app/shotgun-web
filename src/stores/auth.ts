/**
 * Single owner of "who is logged in". Components and the router guard read this;
 * nothing else talks to `api.auth` directly.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import {
  ApiError,
  type ChangePasswordPayload,
  type Credentials,
  type RegisterPayload,
  type UpdateProfilePayload,
  type User,
} from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  /** Set once the session cookie has been checked, so the guard only restores once. */
  const restored = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

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

  async function login(credentials: Credentials): Promise<boolean> {
    const loggedIn = await run(() => api.auth.login(credentials))
    if (!loggedIn) return false
    user.value = loggedIn
    return true
  }

  async function register(payload: RegisterPayload): Promise<boolean> {
    const created = await run(() => api.auth.register(payload))
    if (!created) return false
    user.value = created
    return true
  }

  /** The backend deletes the session row and clears the cookie. Local state is cleared either way. */
  async function logout(): Promise<void> {
    user.value = null
    await api.auth.logout().catch(() => {})
  }

  /** Asks the backend who the session cookie belongs to, on boot / hard refresh. */
  async function restore(): Promise<void> {
    if (restored.value) return
    restored.value = true
    try {
      user.value = await api.auth.me()
    } catch {
      user.value = null
    }
  }

  async function updateProfile(payload: UpdateProfilePayload): Promise<boolean> {
    if (!user.value) return false
    const updated = await run(() => api.auth.updateProfile(payload))
    if (!updated) return false
    // Mutate in place so all reactive consumers (TopNav, etc.) update instantly.
    if (user.value) {
      user.value.name = updated.name
      user.value.email = updated.email
      user.value.phone = updated.phone
    }
    return true
  }

  async function changePassword(payload: ChangePasswordPayload): Promise<boolean> {
    if (!user.value) return false
    await run(() => api.auth.changePassword(payload))
    return !error.value
  }

  /** Deletes the account on the backend (which also ends the session) then clears local state. */
  async function deleteAccount(): Promise<boolean> {
    if (!user.value) return false
    await run(() => api.auth.deleteAccount())
    // run() sets error.value on failure and leaves it null on success.
    if (error.value) return false
    user.value = null
    return true
  }

  return {
    user,
    pending,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    restore,
    updateProfile,
    changePassword,
    deleteAccount,
  }
})
