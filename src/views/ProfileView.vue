<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

// ── View / edit toggle ─────────────────────────────────────────────────────
const editing = ref(false)

// ── Edit-form state ────────────────────────────────────────────────────────
const form = reactive({ name: '', email: '' })
const nameError = ref<string | null>(null)
const emailError = ref<string | null>(null)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  nameError.value = null
  emailError.value = null

  if (!form.name.trim()) {
    nameError.value = 'Name is required.'
  }
  if (!form.email.trim()) {
    emailError.value = 'Email is required.'
  } else if (!EMAIL_RE.test(form.email.trim())) {
    emailError.value = 'Enter a valid email address.'
  }

  return !nameError.value && !emailError.value
}

// Clear per-field errors as the user types.
watch(() => form.name, () => { nameError.value = null })
watch(() => form.email, () => { emailError.value = null })

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
  nameError.value = null
  emailError.value = null
  confirmingDelete.value = false
  auth.error = null
  editing.value = true
}

function cancel() {
  editing.value = false
  confirmingDelete.value = false
  auth.error = null
}

async function save() {
  if (!validate()) return
  const ok = await auth.updateProfile({ name: form.name, email: form.email })
  if (ok) editing.value = false
}

// ── Display helpers ────────────────────────────────────────────────────────
const memberSince = computed(() => {
  const raw = auth.user?.joinedAt
  if (!raw) return '—'
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(raw),
  )
})

const initials = computed(() =>
  (auth.user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <section class="rise max-w-lg">
    <!-- ── Page header ─────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-medium tracking-tight text-ink dark:text-night-ink">My profile</h1>
        <p class="mt-2 text-sm text-ink-soft dark:text-night-ink-soft">
          Your public details visible to drivers and fellow passengers.
        </p>
      </div>

      <!-- Avatar bubble -->
      <span
        class="grid size-14 shrink-0 place-items-center rounded-full bg-brand-600 text-xl font-semibold text-white"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
    </div>

    <!-- ── VIEW MODE ──────────────────────────────────────────────────────── -->
    <template v-if="!editing">
      <dl class="mt-10 divide-y divide-line dark:divide-night-line">
        <div class="grid grid-cols-[7rem_1fr] gap-4 py-4">
          <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Name</dt>
          <dd class="text-sm font-medium text-ink dark:text-night-ink">{{ auth.user?.name }}</dd>
        </div>
        <div class="grid grid-cols-[7rem_1fr] gap-4 py-4">
          <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Email</dt>
          <dd class="text-sm font-medium text-ink dark:text-night-ink">{{ auth.user?.email }}</dd>
        </div>
        <div class="grid grid-cols-[7rem_1fr] gap-4 py-4">
          <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Member since</dt>
          <dd class="text-sm font-medium text-ink dark:text-night-ink">{{ memberSince }}</dd>
        </div>
      </dl>

      <div class="mt-8">
        <button id="profile-edit-btn" type="button" class="btn btn-primary" @click="startEditing">
          Edit profile
        </button>
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

        <!-- API-level error (e.g. email already taken) -->
        <p
          v-if="auth.error"
          class="rounded-card bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
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

        <!-- ── Danger zone ──────────────────────────────────────────────── -->
        <div class="mt-4 border-t border-line pt-6 dark:border-night-line">
          <p class="text-xs font-medium uppercase tracking-widest text-ink-soft dark:text-night-ink-soft">
            Danger zone
          </p>

          <!-- Step 1: initial prompt -->
          <template v-if="!confirmingDelete">
            <p class="mt-2 text-sm text-ink-soft dark:text-night-ink-soft">
              Permanently remove your account and all associated data.
            </p>
            <button
              id="profile-delete-btn"
              type="button"
              class="btn mt-4 border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/60 dark:bg-night-raised dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/40"
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
                class="btn bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
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
      </form>
    </template>
  </section>
</template>
