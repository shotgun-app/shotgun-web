import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useThemeStore } from '../theme'

describe('theme store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to the system theme with no stored pick', () => {
    const theme = useThemeStore()

    expect(theme.choice).toBeNull()
    // jsdom reports no dark preference, so the system theme resolves to light.
    expect(theme.resolved).toBe('light')

    theme.init()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles dark and light and persists each pick', () => {
    const theme = useThemeStore()

    theme.toggle()
    expect(theme.resolved).toBe('dark')
    expect(localStorage.getItem('shotgun.theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    theme.toggle()
    expect(theme.resolved).toBe('light')
    expect(localStorage.getItem('shotgun.theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('restores a stored pick on init', () => {
    localStorage.setItem('shotgun.theme', 'dark')
    const theme = useThemeStore()

    theme.init()

    expect(theme.choice).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('treats a stored value that is not light or dark as system', () => {
    localStorage.setItem('shotgun.theme', 'neon')

    expect(useThemeStore().choice).toBeNull()
  })

  it('follows the OS while unpinned, and stops once the user picks', () => {
    const handlers: Array<(event: { matches: boolean }) => void> = []
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: false,
      media,
      addEventListener: (_type: string, handler: (event: { matches: boolean }) => void) => {
        handlers.push(handler)
      },
      removeEventListener: () => {},
    }))

    const theme = useThemeStore()
    theme.init()
    expect(handlers).toHaveLength(1)

    handlers.forEach((handler) => handler({ matches: true }))
    expect(theme.resolved).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    theme.toggle()
    expect(theme.resolved).toBe('light')

    // The pick wins over later OS changes.
    handlers.forEach((handler) => handler({ matches: false }))
    handlers.forEach((handler) => handler({ matches: true }))
    expect(theme.resolved).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
