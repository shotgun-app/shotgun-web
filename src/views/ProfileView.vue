<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/UserAvatar.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import ProfileDetails from '@/components/ProfileDetails.vue'
import { api } from '@/services/api'
import type { Review } from '@/types'

const auth = useAuthStore()
const router = useRouter()

const driverScore = ref(0)
const reviews = ref<Review[]>([])

async function loadDriverReviews() {
  if (!auth.user) return

  try {
    const profile = await api.users.get(auth.user.id)
    driverScore.value = profile.driverScore
    reviews.value = profile.reviews
  } catch {
    driverScore.value = 0
    reviews.value = []
  }
}

onMounted(loadDriverReviews)

// ── View / edit toggle ─────────────────────────────────────────────────────
const editing = ref(false)

// ── Edit-form state ────────────────────────────────────────────────────────
const form = reactive({ name: '', email: '', phone: '' })
const nameError = ref<string | null>(null)
const emailError = ref<string | null>(null)
const phoneError = ref<string | null>(null)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  nameError.value = null
  emailError.value = null
  phoneError.value = null

  if (!form.name.trim()) {
    nameError.value = 'Name is required.'
  }
  if (!form.email.trim()) {
    emailError.value = 'Email is required.'
  } else if (!EMAIL_RE.test(form.email.trim())) {
    emailError.value = 'Enter a valid email address.'
  }

  if (!form.phone) {
    phoneError.value = 'Phone number is required.'
  }

  return !nameError.value && !emailError.value && !phoneError.value
}

// Clear per-field errors as the user types.
watch(
  () => form.name,
  () => {
    nameError.value = null
  },
)
watch(
  () => form.phone,
  () => {
    phoneError.value = null
  },
)
watch(
  () => form.email,
  () => {
    emailError.value = null
  },
)

// ── Delete-account state ───────────────────────────────────────────────────
/** Two-step confirmation: first click reveals the real delete button. */
const confirmingDelete = ref(false)

function requestDelete() {
  confirmingDelete.value = true
}

function cancelDelete() {
  confirmingDelete.value = false
}

async function confirmDelete() {
  const ok = await auth.deleteAccount()
  if (ok) {
    await router.push({ name: 'landing' })
  }
}

// ── Actions ────────────────────────────────────────────────────────────────
function startEditing() {
  form.name = auth.user?.name ?? ''
  form.email = auth.user?.email ?? ''
  form.phone = auth.user?.phone ?? ''
  nameError.value = null
  emailError.value = null
  phoneError.value = null
  confirmingDelete.value = false
  auth.error = null
  editing.value = true
}

// ── Change password ────────────────────────────────────────────────────────
const changingPassword = ref(false)
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const passwordError = ref<string | null>(null)
const passwordChanged = ref(false)

function openPasswordForm() {
  passwordForm.current = ''
  passwordForm.next = ''
  passwordForm.confirm = ''
  passwordError.value = null
  passwordChanged.value = false
  auth.error = null
  changingPassword.value = true
}

function closePasswordForm() {
  changingPassword.value = false
  passwordError.value = null
  auth.error = null
}

async function submitPassword() {
  passwordError.value = null
  if (passwordForm.next.length < 8) {
    passwordError.value = 'New password must be at least 8 characters.'
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    passwordError.value = 'The new passwords do not match.'
    return
  }
  const ok = await auth.changePassword({
    currentPassword: passwordForm.current,
    newPassword: passwordForm.next,
  })
  if (ok) {
    changingPassword.value = false
    passwordChanged.value = true
  }
}

function cancel() {
  editing.value = false
  confirmingDelete.value = false
  auth.error = null
}

async function save() {
  if (!validate()) return
  const ok = await auth.updateProfile({
    name: form.name,
    email: form.email,
    phone: form.phone,
  })
  if (ok) editing.value = false
}
</script>

<template>
  <section class="rise max-w-2xl">
    <!-- ── Page header ─────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="page-title">My profile</h1>
        <p class="page-lead">Your public details visible to drivers and fellow passengers.</p>
      </div>

      <UserAvatar :name="auth.user?.name" size="lg" />
    </div>

    <!-- ── VIEW MODE ──────────────────────────────────────────────────────── -->
    <template v-if="!editing">
      <ProfileDetails v-if="auth.user" :user="auth.user" class="mt-10" />
      <!-- Driver Score -->
      <section class="mt-10">
        <h2 class="section-title">Driver Score</h2>

        <div class="mt-4 flex items-center gap-3">
          <span class="text-lg font-semibold">
            {{ driverScore.toFixed(1) }}
          </span>

          <div class="flex items-center gap-0.5 text-base" aria-label="Driver rating">
            <span v-for="star in 5" :key="star">
              {{ star <= Math.round(driverScore) ? '★' : '☆' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Reviews -->
      <section class="mt-10">
        <h2 class="section-title">Reviews</h2>

        <p v-if="reviews.length === 0" class="meta mt-3 text-sm">No reviews yet.</p>

        <ul v-else class="mt-4 grid gap-4">
          <li v-for="review in reviews" :key="review.id" class="card">
            <!-- Stars -->
            <div class="flex items-center gap-1 text-sm">
              <span v-for="star in 5" :key="star">
                {{ star <= review.rating ? '★' : '☆' }}
              </span>
            </div>

            <!-- Comment -->
            <p v-if="review.comment" class="mt-3 text-sm">
              {{ review.comment }}
            </p>

            <!-- Date -->
            <p class="meta mt-2 text-xs">
              {{ new Date(review.createdAt).toLocaleDateString() }}
            </p>
          </li>
        </ul>
      </section>

      <div class="mt-8">
        <button id="profile-edit-btn" type="button" class="btn btn-primary" @click="startEditing">
          Edit profile
        </button>
      </div>

      <!-- ── Change password ──────────────────────────────────────────── -->
      <div class="mt-10 border-t border-line pt-6 dark:border-night-line">
        <h2 class="section-title">Password</h2>

        <p
          v-if="passwordChanged"
          id="profile-password-success"
          class="alert alert-success mt-3"
          role="status"
        >
          Password changed. Your other devices were logged out.
        </p>

        <button
          v-if="!changingPassword"
          id="profile-password-btn"
          type="button"
          class="btn btn-ghost mt-4"
          @click="openPasswordForm"
        >
          Change password
        </button>

        <form
          v-else
          id="profile-password-form"
          class="mt-4 grid gap-5"
          @submit.prevent="submitPassword"
        >
          <label class="field">
            <span>Current password</span>
            <PasswordInput
              id="profile-current-password"
              v-model="passwordForm.current"
              autocomplete="current-password"
              required
            />
          </label>
          <label class="field">
            <span>New password</span>
            <PasswordInput
              id="profile-new-password"
              v-model="passwordForm.next"
              autocomplete="new-password"
              placeholder="At least 8 characters"
              :minlength="8"
              required
            />
          </label>
          <label class="field">
            <span>Confirm new password</span>
            <PasswordInput
              id="profile-confirm-password"
              v-model="passwordForm.confirm"
              autocomplete="new-password"
              required
            />
          </label>

          <p v-if="passwordError || auth.error" class="alert alert-error" role="alert">
            {{ passwordError ?? auth.error }}
          </p>

          <div class="flex items-center gap-3">
            <button
              id="profile-password-save-btn"
              type="submit"
              class="btn btn-primary"
              :disabled="auth.pending"
            >
              {{ auth.pending ? 'Saving…' : 'Update password' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              :disabled="auth.pending"
              @click="closePasswordForm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- ── Delete account ──────────────────────────────────────────────── -->
      <div class="mt-10 border-t border-line pt-6 dark:border-night-line">
        <h2 class="section-title">Delete account</h2>

        <!-- Step 1: initial prompt -->
        <template v-if="!confirmingDelete">
          <p class="meta mt-2 text-sm">Permanently remove your account and all associated data.</p>
          <button
            id="profile-delete-btn"
            type="button"
            class="btn btn-danger mt-4"
            :disabled="auth.pending"
            @click="requestDelete"
          >
            Delete my account
          </button>
        </template>

        <!-- Step 2: confirmation -->
        <template v-else>
          <p class="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
            Are you sure? This cannot be undone.
          </p>
          <div class="mt-4 flex items-center gap-3">
            <button
              id="profile-delete-confirm-btn"
              type="button"
              class="btn btn-danger-solid"
              :disabled="auth.pending"
              @click="confirmDelete"
            >
              {{ auth.pending ? 'Deleting…' : 'Yes, delete my account' }}
            </button>
            <button
              id="profile-delete-cancel-btn"
              type="button"
              class="btn btn-ghost"
              :disabled="auth.pending"
              @click="cancelDelete"
            >
              Keep my account
            </button>
          </div>
        </template>
      </div>
    </template>

    <!-- ── EDIT MODE ──────────────────────────────────────────────────────── -->
    <template v-else>
      <form id="profile-edit-form" class="mt-10 grid gap-6" @submit.prevent="save">
        <!-- Name field -->
        <label class="field">
          <span>Name</span>
          <input
            id="profile-name-input"
            v-model="form.name"
            type="text"
            autocomplete="name"
            placeholder="Your name"
            :aria-invalid="!!nameError"
            :aria-describedby="nameError ? 'profile-name-error' : undefined"
          />
          <p
            v-if="nameError"
            id="profile-name-error"
            class="mt-0.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {{ nameError }}
          </p>
        </label>

        <!-- Email field -->
        <label class="field">
          <span>Email</span>
          <input
            id="profile-email-input"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :aria-invalid="!!emailError"
            :aria-describedby="emailError ? 'profile-email-error' : undefined"
          />
          <p
            v-if="emailError"
            id="profile-email-error"
            class="mt-0.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {{ emailError }}
          </p>
        </label>

        <!-- Phone field -->
        <div class="field">
          <span>Phone</span>
          <PhoneInput id="profile-phone-input" v-model="form.phone" required />
          <p
            v-if="phoneError"
            id="profile-phone-error"
            class="mt-0.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {{ phoneError }}
          </p>
        </div>

        <!-- API-level error (e.g. email already taken) -->
        <p v-if="auth.error" class="alert alert-error" role="alert">
          {{ auth.error }}
        </p>

        <!-- Save / Cancel -->
        <div class="flex items-center gap-3">
          <button
            id="profile-save-btn"
            type="submit"
            class="btn btn-primary"
            :disabled="auth.pending"
          >
            {{ auth.pending ? 'Saving…' : 'Save changes' }}
          </button>
          <button
            id="profile-cancel-btn"
            type="button"
            class="btn btn-ghost"
            :disabled="auth.pending"
            @click="cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </template>
  </section>
</template>
