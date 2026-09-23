import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import ProfileView from '../ProfileView.vue'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/mock/data'

const blank = { template: '<div />' }

function buildRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: blank },
      { path: '/app', name: 'app', component: blank },
      { path: '/app/profile', name: 'profile', component: blank },
    ],
  })
}

async function mountProfile(router: Router) {
  const wrapper = mount(ProfileView, {
    global: { plugins: [router] },
  })
  // Let Vue flush reactive updates.
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('ProfileView', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()

    router = buildRouter()
    await router.push('/app/profile')
    await router.isReady()

    // Log in with the demo account so auth.user is populated.
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
  })

  // ── View mode ────────────────────────────────────────────────────────────

  it('shows name, email and member-since in view mode', async () => {
    const wrapper = await mountProfile(router)

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('alice@shotgun.app')
    // "Member since" row must exist
    expect(wrapper.text()).toContain('Member since')
    // Date is formatted – at minimum a year should appear
    expect(wrapper.text()).toMatch(/20\d\d/)
  })

  it('shows "Edit profile" button in view mode', async () => {
    const wrapper = await mountProfile(router)

    expect(wrapper.find('#profile-edit-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-edit-form').exists()).toBe(false)
  })

  // ── Toggle ───────────────────────────────────────────────────────────────

  it('switches to edit mode when "Edit profile" is clicked', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#profile-edit-form').exists()).toBe(true)
    expect(wrapper.find('#profile-edit-btn').exists()).toBe(false)
  })

  it('pre-fills edit form with current user values', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    const nameInput = wrapper.find<HTMLInputElement>('#profile-name-input')
    const emailInput = wrapper.find<HTMLInputElement>('#profile-email-input')

    expect(nameInput.element.value).toBe('Alice')
    expect(emailInput.element.value).toBe('alice@shotgun.app')
  })

  // ── Cancel ───────────────────────────────────────────────────────────────

  it('cancel returns to view mode without changing the store', async () => {
    const auth = useAuthStore()
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-name-input').setValue('Tampered')
    await wrapper.find('#profile-cancel-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // Back in view mode, name unchanged
    expect(wrapper.find('#profile-edit-btn').exists()).toBe(true)
    expect(auth.user?.name).toBe('Alice')
  })

  // ── Validation ───────────────────────────────────────────────────────────

  it('shows validation error when name is cleared and save is attempted', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-name-input').setValue('')
    await wrapper.find('#profile-edit-form').trigger('submit')
    await wrapper.vm.$nextTick()

    const nameError = wrapper.find('#profile-name-error')
    expect(nameError.exists()).toBe(true)
    expect(nameError.text()).toBeTruthy()
  })

  it('shows validation error when email is cleared', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-email-input').setValue('')
    await wrapper.find('#profile-edit-form').trigger('submit')
    await wrapper.vm.$nextTick()

    const emailError = wrapper.find('#profile-email-error')
    expect(emailError.exists()).toBe(true)
    expect(emailError.text()).toBeTruthy()
  })

  it('shows validation error for an invalid email format', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-email-input').setValue('not-an-email')
    await wrapper.find('#profile-edit-form').trigger('submit')
    await wrapper.vm.$nextTick()

    const emailError = wrapper.find('#profile-email-error')
    expect(emailError.exists()).toBe(true)
  })

  // ── Successful save ──────────────────────────────────────────────────────

  it('save updates the store and returns to view mode', async () => {
    const auth = useAuthStore()
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-name-input').setValue('Alice Updated')
    await wrapper.find('#profile-edit-form').trigger('submit')

    // Wait for the mock async delay
    await new Promise((r) => setTimeout(r, 500))
    await wrapper.vm.$nextTick()

    // Store is updated
    expect(auth.user?.name).toBe('Alice Updated')
    // Returned to view mode
    expect(wrapper.find('#profile-edit-btn').exists()).toBe(true)
    // New name is shown
    expect(wrapper.text()).toContain('Alice Updated')
  })
})

// ── Auth store: updateProfile action ─────────────────────────────────────────

describe('auth store – updateProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('updates name and email in the store', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)

    const ok = await auth.updateProfile({ name: 'New Name', email: 'new@shotgun.app' })

    expect(ok).toBe(true)
    expect(auth.user?.name).toBe('New Name')
    expect(auth.user?.email).toBe('new@shotgun.app')
  })

  it('returns false and sets error when email is already taken', async () => {
    // Use Ben's account to avoid interference from any Alice email mutation in prior tests.
    const auth = useAuthStore()
    await auth.login({ email: 'ben@shotgun.app', password: 'password123' })

    // clara@shotgun.app belongs to a different mock account
    const ok = await auth.updateProfile({ name: 'Ben Foster', email: 'clara@shotgun.app' })

    expect(ok).toBe(false)
    expect(auth.error).toBeTruthy()
    // Store user is unchanged
    expect(auth.user?.name).toBe('Ben Foster')
    expect(auth.user?.email).toBe('ben@shotgun.app')
  })

  it('persists the update so me() returns the new values', async () => {
    const auth = useAuthStore()
    await auth.login({ email: 'markus@shotgun.app', password: 'password123' })
    // Capture token before we replace the Pinia instance.
    const token = auth.token!

    await auth.updateProfile({ name: 'Persisted Name', email: 'persisted@shotgun.app' })

    // Create a fresh store instance and verify the mock layer kept the mutation.
    setActivePinia(createPinia())
    const freshAuth = useAuthStore()
    const user = await import('@/services/api').then(({ api }) => api.auth.me(token))

    expect(user.name).toBe('Persisted Name')
    expect(user.email).toBe('persisted@shotgun.app')
    // Confirm the fresh store can log in with the updated email.
    expect(await freshAuth.login({ email: 'persisted@shotgun.app', password: 'password123' })).toBe(
      true,
    )
  })
})

// ── Delete-account flow ───────────────────────────────────────────────────────

describe('ProfileView – delete account', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()

    router = buildRouter()
    await router.push('/app/profile')
    await router.isReady()

    const auth = useAuthStore()
    // Use Ben's account — email is unaffected by the updateProfile describe block above.
    await auth.login({ email: 'ben@shotgun.app', password: 'password123' })
  })

  it('does not show the delete button in view mode', async () => {
    const wrapper = await mountProfile(router)
    expect(wrapper.find('#profile-delete-btn').exists()).toBe(false)
  })

  it('shows the delete button after entering edit mode', async () => {
    const wrapper = await mountProfile(router)
    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#profile-delete-btn').exists()).toBe(true)
    // Confirmation step is not yet shown
    expect(wrapper.find('#profile-delete-confirm-btn').exists()).toBe(false)
  })

  it('reveals confirmation step after clicking "Delete my account"', async () => {
    const wrapper = await mountProfile(router)
    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-delete-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#profile-delete-confirm-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-delete-cancel-btn').exists()).toBe(true)
    // Initial delete button is gone
    expect(wrapper.find('#profile-delete-btn').exists()).toBe(false)
  })

  it('"Keep my account" hides the confirmation and restores the initial delete button', async () => {
    const wrapper = await mountProfile(router)
    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-delete-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-delete-cancel-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#profile-delete-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-delete-confirm-btn').exists()).toBe(false)
  })

  it('confirming deletion logs out and navigates to landing', async () => {
    // Register a fresh throwaway account so this test is isolated from seed-data mutations.
    const auth = useAuthStore()
    await auth.register({ name: 'Delete Me', email: 'delete-view@test.app', password: 'password123' })

    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-delete-btn').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('#profile-delete-confirm-btn').trigger('click')
    await new Promise((r) => setTimeout(r, 500))
    await wrapper.vm.$nextTick()

    expect(auth.isAuthenticated).toBe(false)
    expect(router.currentRoute.value.name).toBe('landing')
  })
})

describe('auth store – deleteAccount', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('clears the session and returns true on success', async () => {
    const auth = useAuthStore()
    // Register a fresh throwaway account so this test is isolated from seed-data mutations.
    await auth.register({ name: 'Delete Me', email: 'delete-store-1@test.app', password: 'password123' })

    const ok = await auth.deleteAccount()

    expect(ok).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(localStorage.getItem('shotgun.token')).toBeNull()
  })

  it('makes the account unreachable after deletion', async () => {
    const auth = useAuthStore()
    // Register a fresh throwaway account so this test is isolated from seed-data mutations.
    const throwawayCredentials = { email: 'delete-store-2@test.app', password: 'password123' }
    await auth.register({ name: 'Delete Me 2', ...throwawayCredentials })

    await auth.deleteAccount()

    // A fresh login attempt with the old credentials should now fail.
    setActivePinia(createPinia())
    const freshAuth = useAuthStore()
    const ok = await freshAuth.login(throwawayCredentials)
    expect(ok).toBe(false)
  })
})


