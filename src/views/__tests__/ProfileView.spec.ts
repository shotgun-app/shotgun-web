import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { resetFakeApi } from '@/test/fakeApi'
import { api } from '@/services/api'

import ProfileView from '../ProfileView.vue'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/test/seed'

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
    global: {
      plugins: [router],
    },
  })

  await flushPromises()
  await wrapper.vm.$nextTick()

  return wrapper
}

describe('ProfileView', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()

    router = buildRouter()
    await router.push('/app/profile')
    await router.isReady()

    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
  })

  it('saves a selected car and displays its CO₂ emissions', async () => {
    const wrapper = await mountProfile(router)

    // Select Renault.
    await wrapper.get('#profile-car-brand').setValue('Renault')
    await flushPromises()

    // Select Zoe.
    const modelSelect = wrapper.get<HTMLSelectElement>('#profile-car-model')

    const zoeOption = Array.from(modelSelect.element.options).find(
      (option) => option.value === 'car_3',
    )

    expect(zoeOption).toBeDefined()

    await modelSelect.setValue('car_3')
    await wrapper.get('#profile-car-form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Renault')
    expect(wrapper.text()).toContain('Zoe')
    expect(wrapper.text()).toContain('0 g CO₂/km')
    expect(wrapper.text()).toContain('Your car has been saved.')
  })

  it('shows name, email and member-since in view mode', async () => {
    const wrapper = await mountProfile(router)

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('alice@shotgun.app')
    expect(wrapper.text()).toContain('Member since')
    expect(wrapper.text()).toMatch(/20\d\d/)
  })

  it('shows "Edit profile" button in view mode', async () => {
    const wrapper = await mountProfile(router)

    expect(wrapper.find('#profile-edit-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-edit-form').exists()).toBe(false)
  })

  it('switches to edit mode when "Edit profile" is clicked', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('#profile-edit-form').exists()).toBe(true)
    expect(wrapper.find('#profile-edit-btn').exists()).toBe(false)
  })

  it('pre-fills edit form with current user values', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    const nameInput = wrapper.find<HTMLInputElement>('#profile-name-input')
    const emailInput = wrapper.find<HTMLInputElement>('#profile-email-input')

    expect(nameInput.element.value).toBe('Alice')
    expect(emailInput.element.value).toBe('alice@shotgun.app')
  })

  it('cancel returns to view mode without changing the store', async () => {
    const auth = useAuthStore()
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-name-input').setValue('Tampered')
    await wrapper.find('#profile-cancel-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('#profile-edit-btn').exists()).toBe(true)
    expect(auth.user?.name).toBe('Alice')
  })

  it('shows validation error when name is cleared and save is attempted', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-name-input').setValue('')
    await wrapper.find('#profile-edit-form').trigger('submit')
    await flushPromises()

    const nameError = wrapper.find('#profile-name-error')

    expect(nameError.exists()).toBe(true)
    expect(nameError.text()).toBeTruthy()
  })

  it('shows validation error when email is cleared', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-email-input').setValue('')
    await wrapper.find('#profile-edit-form').trigger('submit')
    await flushPromises()

    const emailError = wrapper.find('#profile-email-error')

    expect(emailError.exists()).toBe(true)
    expect(emailError.text()).toBeTruthy()
  })

  it('shows validation error for an invalid email format', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-email-input').setValue('not-an-email')
    await wrapper.find('#profile-edit-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('#profile-email-error').exists()).toBe(true)
  })

  it('save updates the store and returns to view mode', async () => {
    const auth = useAuthStore()
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-name-input').setValue('Alice Updated')
    await wrapper.find('#profile-edit-form').trigger('submit')
    await flushPromises()

    expect(auth.user?.name).toBe('Alice Updated')
    expect(wrapper.find('#profile-edit-btn').exists()).toBe(true)
    expect(wrapper.text()).toContain('Alice Updated')
  })
})

describe('auth store – updateProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('updates name and email in the store', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)

    const ok = await auth.updateProfile({
      name: 'New Name',
      email: 'new@shotgun.app',
      phone: '',
    })

    expect(ok).toBe(true)
    expect(auth.user?.name).toBe('New Name')
    expect(auth.user?.email).toBe('new@shotgun.app')
  })

  it('returns false and sets error when email is already taken', async () => {
    const auth = useAuthStore()
    await auth.login({
      email: 'ben@shotgun.app',
      password: 'password123',
    })

    const ok = await auth.updateProfile({
      name: 'Ben Foster',
      email: 'clara@shotgun.app',
      phone: '',
    })

    expect(ok).toBe(false)
    expect(auth.error).toBeTruthy()
    expect(auth.user?.name).toBe('Ben Foster')
    expect(auth.user?.email).toBe('ben@shotgun.app')
  })

  it('persists the update so me() returns the new values', async () => {
    const auth = useAuthStore()
    await auth.login({
      email: 'markus@shotgun.app',
      password: 'password123',
    })

    await auth.updateProfile({
      name: 'Persisted Name',
      email: 'persisted@shotgun.app',
      phone: '',
    })

    setActivePinia(createPinia())

    const freshAuth = useAuthStore()
    const { api } = await import('@/services/api')
    const user = await api.auth.me()

    expect(user.name).toBe('Persisted Name')
    expect(user.email).toBe('persisted@shotgun.app')
    expect(
      await freshAuth.login({
        email: 'persisted@shotgun.app',
        password: 'password123',
      }),
    ).toBe(true)
  })
})

describe('ProfileView – delete account', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()

    router = buildRouter()
    await router.push('/app/profile')
    await router.isReady()

    const auth = useAuthStore()
    await auth.login({
      email: 'ben@shotgun.app',
      password: 'password123',
    })
  })

  it('does not show the delete button in edit mode', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-edit-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('#profile-delete-btn').exists()).toBe(false)
  })

  it('shows the delete button in view mode, under the password section', async () => {
    const wrapper = await mountProfile(router)

    expect(wrapper.find('#profile-delete-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-delete-confirm-btn').exists()).toBe(false)
  })

  it('reveals confirmation step after clicking "Delete my account"', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-delete-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('#profile-delete-confirm-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-delete-cancel-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-delete-btn').exists()).toBe(false)
  })

  it('"Keep my account" hides the confirmation and restores the initial delete button', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-delete-btn').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-delete-cancel-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('#profile-delete-btn').exists()).toBe(true)
    expect(wrapper.find('#profile-delete-confirm-btn').exists()).toBe(false)
  })

  it('confirming deletion logs out and navigates to landing', async () => {
    const auth = useAuthStore()

    await auth.register({
      name: 'Delete Me',
      email: 'delete-view@test.app',
      password: 'password123',
      phone: '+38640123456',
    })

    const wrapper = await mountProfile(router)

    await wrapper.find('#profile-delete-btn').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-delete-confirm-btn').trigger('click')
    await flushPromises()

    expect(auth.isAuthenticated).toBe(false)
    expect(router.currentRoute.value.name).toBe('landing')
  })
})

describe('auth store – deleteAccount', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('clears the session and returns true on success', async () => {
    const auth = useAuthStore()

    await auth.register({
      name: 'Delete Me',
      email: 'delete-store-1@test.app',
      password: 'password123',
      phone: '+38640123456',
    })

    const ok = await auth.deleteAccount()

    expect(ok).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  it('makes the account unreachable after deletion', async () => {
    const auth = useAuthStore()
    const throwawayCredentials = {
      email: 'delete-store-2@test.app',
      password: 'password123',
    }

    await auth.register({
      name: 'Delete Me 2',
      phone: '+38640123456',
      ...throwawayCredentials,
    })

    await auth.deleteAccount()

    setActivePinia(createPinia())

    const freshAuth = useAuthStore()
    const ok = await freshAuth.login(throwawayCredentials)

    expect(ok).toBe(false)
  })
})

describe('ProfileView phone and password', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()

    router = buildRouter()
    await router.push('/app/profile')
    await router.isReady()

    await useAuthStore().login(DEMO_CREDENTIALS)
  })

  it('saves a phone number chosen with a country code', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.get('#profile-edit-btn').trigger('click')
    await flushPromises()

    await wrapper.get('select[aria-label="Country code"]').setValue('Germany')
    await wrapper.get('input[aria-label="Phone number"]').setValue('0151 2345678')
    await wrapper.get('#profile-edit-form').trigger('submit')
    await flushPromises()

    expect(useAuthStore().user?.phone).toBe('+491512345678')
    expect(wrapper.get('#profile-phone').text()).toBe('+49 1512345678')
  })

  it('changes the password and accepts the new one at login', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.get('#profile-password-btn').trigger('click')
    await flushPromises()

    await wrapper.get('#profile-current-password').setValue('password123')
    await wrapper.get('#profile-new-password').setValue('brandnew456')
    await wrapper.get('#profile-confirm-password').setValue('brandnew456')
    await wrapper.get('#profile-password-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('#profile-password-success').exists()).toBe(true)

    const auth = useAuthStore()
    await auth.logout()

    expect(
      await auth.login({
        email: DEMO_CREDENTIALS.email,
        password: 'brandnew456',
      }),
    ).toBe(true)
  })

  it('lists sessions and deletes another device', async () => {
    await useAuthStore().login(DEMO_CREDENTIALS)

    const wrapper = await mountProfile(router)

    const cards = wrapper.findAll('[id^="session-"]')

    expect(cards).toHaveLength(2)
    expect(cards[0]!.text()).toContain('This device')
    expect(cards[1]!.text()).not.toContain('This device')

    await cards[1]!.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[id^="session-"]')).toHaveLength(1)
    expect(useAuthStore().user).not.toBeNull()
  })

  it('signs out to the landing page when the current session is deleted', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.get('[id^="session-"] button').trigger('click')
    await flushPromises()

    expect(useAuthStore().user).toBeNull()
    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('rejects mismatched confirmation and a wrong current password', async () => {
    const wrapper = await mountProfile(router)

    await wrapper.get('#profile-password-btn').trigger('click')
    await flushPromises()

    await wrapper.get('#profile-current-password').setValue('password123')
    await wrapper.get('#profile-new-password').setValue('brandnew456')
    await wrapper.get('#profile-confirm-password').setValue('different789')
    await wrapper.get('#profile-password-form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('do not match')

    await wrapper.get('#profile-current-password').setValue('wrong-password')
    await wrapper.get('#profile-confirm-password').setValue('brandnew456')
    await wrapper.get('#profile-password-form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Current password is incorrect.')
  })
})

describe('ProfileView – profile picture', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()
    router = buildRouter()
    await router.push('/app/profile')
    await router.isReady()
    await useAuthStore().login(DEMO_CREDENTIALS)
  })

  async function choose(wrapper: Awaited<ReturnType<typeof mountProfile>>, file: File) {
    const input = wrapper.get<HTMLInputElement>('#profile-picture-input')
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()
  }

  it('uploads a picture, then removes it after confirming', async () => {
    const wrapper = await mountProfile(router)
    expect(wrapper.find('#profile-picture-remove-btn').exists()).toBe(false)

    await choose(wrapper, new File(['png'], 'me.png', { type: 'image/png' }))

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.get('#profile-picture-btn').attributes('aria-label')).toBe('Change picture')

    await wrapper.get('#profile-picture-remove-btn').trigger('click')
    await wrapper.get('#profile-picture-remove-confirm-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('#profile-picture-btn').attributes('aria-label')).toBe('Upload picture')
  })

  it('shows the error for a file that is not an image', async () => {
    const wrapper = await mountProfile(router)

    await choose(wrapper, new File(['hi'], 'notes.txt', { type: 'text/plain' }))

    expect(wrapper.get('[role="alert"]').text()).toBe('Picture must be a JPEG, PNG or WebP image.')
  })
})

describe('ProfileView – environmental impact', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    resetFakeApi()
    router = buildRouter()
    await router.push('/app/profile')
    await router.isReady()
    await useAuthStore().login(DEMO_CREDENTIALS)
  })

  it('renders passenger and driver impact cards', async () => {
    const get = api.users.get.bind(api.users)
    vi.spyOn(api.users, 'get').mockImplementation(async (id: string) => ({
      ...(await get(id)),
      passengerImpact: { rides: 2, co2SavedKg: 28.5 },
      driverImpact: { rides: 4, co2SavedKg: 95.2 },
    }))

    const wrapper = await mountProfile(router)

    const passengerCard = wrapper.get('#profile-passenger-impact')
    expect(passengerCard.get('[data-test="impact-co2"]').text()).toBe('28.5 kg CO₂')
    expect(passengerCard.get('[data-test="impact-rides"]').text()).toBe('2')

    const driverCard = wrapper.get('#profile-driver-impact')
    expect(driverCard.get('[data-test="impact-co2"]').text()).toBe('95.2 kg CO₂')
    expect(driverCard.get('[data-test="impact-rides"]').text()).toBe('4')
    expect(driverCard.text()).toContain('Helped reduce cars on the road.')
  })
})
