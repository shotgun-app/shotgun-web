/**
 * Single owner of "who is logged in". Components and the router guard read this;
 * nothing else talks to `api.auth` directly.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { ApiError, type Credentials, type RegisterPayload, type User } from '@/types'

const TOKEN_KEY = 'shotgun.token'

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Private mode / blocked storage: session simply does not survive a reload.
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(readStoredToken())
  const pending = ref(false)
  const error = ref<string | null>(null)

  /** Set once the stored token has been checked, so the guard only restores once. */
  const restored = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  function setSession(next: { token: string; user: User }): void {
    token.value = next.token
    user.value = next.user
    writeStoredToken(next.token)
  }

  function clearSession(): void {
    token.value = null
    user.value = null
    writeStoredToken(null)
  }

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
    const session = await run(() => api.auth.login(credentials))
    if (!session) return false
    setSession(session)
    return true
  }

  async function register(payload: RegisterPayload): Promise<boolean> {
    const session = await run(() => api.auth.register(payload))
    if (!session) return false
    setSession(session)
    return true
  }

  async function logout(): Promise<void> {
    const current = token.value
    clearSession()
    if (current) await api.auth.logout(current).catch(() => {})
  }

  /** Turns a stored token back into a user on boot / hard refresh. */
  async function restore(): Promise<void> {
    if (restored.value) return
    restored.value = true
    if (!token.value) return
    try {
      user.value = await api.auth.me(token.value)
    } catch {
      clearSession()
    }
  }

  return {
    user,
    token,
    pending,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    restore,
  }
})
