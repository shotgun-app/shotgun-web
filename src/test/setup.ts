import { vi } from 'vitest'

// The app talks to the real backend; unit tests get an in-memory stand-in instead
vi.mock('@/services/api', async () => {
  const { fakeApi } = await import('./fakeApi')
  return { api: fakeApi }
})
