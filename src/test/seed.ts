/** Seed data for the test-only fake API (src/test/fakeApi.ts). Not part of the app bundle. */
import type { User } from '@/types'

/** Passwords are plain text on purpose: test double only. */
export interface MockAccount {
  password: string
  user: User
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    password: 'password123',
    user: {
      id: 'usr_1',
      email: 'alice@shotgun.app',
      name: 'Alice',
      avatarUrl: null,
      phone: '+1 415 555 0142',
      joinedAt: '2026-01-14T09:00:00Z',
      rating: 4.8,
      ratingCount: 24,
      co2SavedKg: 128.4,
    },
  },
  {
    password: 'password123',
    user: {
      id: 'usr_2',
      email: 'ben@shotgun.app',
      name: 'Ben Foster',
      avatarUrl: null,
      phone: '+1 415 555 0177',
      joinedAt: '2026-03-02T09:00:00Z',
      rating: 4.5,
      ratingCount: 11,
      co2SavedKg: 63.0,
    },
  },
  {
    password: 'password123',
    user: {
      id: 'usr_3',
      email: 'clara@shotgun.app',
      name: 'Clara Lindqvist',
      avatarUrl: null,
      phone: '+46 70 123 4567',
      joinedAt: '2026-02-10T11:00:00Z',
      rating: 4.9,
      ratingCount: 32,
      co2SavedKg: 195.2,
    },
  },
  {
    password: 'password123',
    user: {
      id: 'usr_4',
      email: 'markus@shotgun.app',
      name: 'Markus Schmidt',
      avatarUrl: null,
      phone: '+49 151 2345678',
      joinedAt: '2026-02-18T14:30:00Z',
      rating: 4.7,
      ratingCount: 19,
      co2SavedKg: 88.6,
    },
  },
]

/** Seeded account most specs log in as. */
export const DEMO_CREDENTIALS = {
  email: 'alice@shotgun.app',
  password: 'password123',
}

/** Helper to generate ISO departure timestamps relative to today */
export function relativeDate(daysAhead: number, hours: number, minutes: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const min = String(minutes).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}:00Z`
}
