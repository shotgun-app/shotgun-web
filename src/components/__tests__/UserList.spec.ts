import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import UserList from '../UserList.vue'
import type { PublicUser } from '@/types'

const blank = { render: () => null }
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: blank },
    { path: '/app/users/:id', name: 'user', component: blank },
  ],
})

const users: PublicUser[] = [
  { id: 'usr_2', name: 'Ben Foster', joinedAt: '2026-03-02T09:00:00Z' },
  { id: 'usr_3', name: 'Clara Lindqvist', joinedAt: '2026-02-10T11:00:00Z' },
]

function mountList(props: { users: PublicUser[]; empty?: string }) {
  return mount(UserList, { props, global: { plugins: [router] } })
}

describe('UserList', () => {
  it('links each user to their profile in a new tab', () => {
    const links = mountList({ users }).findAll('a')

    expect(links.map((a) => a.attributes('href'))).toEqual(['/app/users/usr_2', '/app/users/usr_3'])
    expect(links.map((a) => a.attributes('target'))).toEqual(['_blank', '_blank'])
  })

  it('separates names with commas', () => {
    const text = mountList({ users }).text()

    expect(text).toContain('Ben Foster,')
    expect(text).not.toContain('Lindqvist,')
  })

  it('shows the empty text when nobody is listed', () => {
    expect(mountList({ users: [], empty: 'No other passengers' }).text()).toBe(
      'No other passengers',
    )
  })
})
