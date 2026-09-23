/**
 * Single owner of the colour theme. With no stored choice it follows the OS;
 * the toggle flips between light and dark and remembers the pick. The resolved
 * value is mirrored onto <html class="dark">, which is what the Tailwind
 * `dark:` variant matches on (see the @custom-variant in main.css).
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeChoice = 'light' | 'dark'

const THEME_KEY = 'shotgun.theme'
const SYSTEM_QUERY = '(prefers-color-scheme: dark)'

/** Anything but an explicit light/dark pick (including stale values) means system. */
function readStoredChoice(): ThemeChoice | null {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

/** `matchMedia` is missing in jsdom, so the system theme falls back to light there. */
function systemQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(SYSTEM_QUERY)
    : null
}

export const useThemeStore = defineStore('theme', () => {
  const choice = ref<ThemeChoice | null>(readStoredChoice())
  const systemDark = ref(systemQuery()?.matches ?? false)

  const resolved = computed<ThemeChoice>(
    () => choice.value ?? (systemDark.value ? 'dark' : 'light'),
  )

  let following = false

  function apply(): void {
    document.documentElement.classList.toggle('dark', resolved.value === 'dark')
  }

  /** Called once from main.ts: paints the stored theme and tracks the OS. */
  function init(): void {
    apply()
    if (following) return
    following = true
    systemQuery()?.addEventListener('change', (event) => {
      systemDark.value = event.matches
      apply()
    })
  }

  function toggle(): void {
    choice.value = resolved.value === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(THEME_KEY, choice.value)
    } catch {
      // Private mode / blocked storage: the choice simply does not survive a reload.
    }
    apply()
  }

  return { choice, resolved, toggle, init }
})
