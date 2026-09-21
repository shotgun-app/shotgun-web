<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/mock/data'
import { USE_MOCK_API } from '@/services/api'

type Mode = 'login' | 'register'

const auth = useAuthStore()
const router = useRouter()

const mode = ref<Mode>('login')
const form = reactive({ name: '', email: '', password: '' })

watch(mode, () => {
  auth.error = null
})

async function submit() {
  const ok =
    mode.value === 'login'
      ? await auth.login({ email: form.email, password: form.password })
      : await auth.register({ name: form.name, email: form.email, password: form.password })

  if (ok) await router.push({ name: 'app' })
}

/** Mock-only convenience: fill the seeded account so the demo is one click. */
function fillDemo() {
  form.email = DEMO_CREDENTIALS.email
  form.password = DEMO_CREDENTIALS.password
}
</script>

<template>
  <div class="w-full max-w-sm">
    <h2 class="text-2xl font-medium tracking-tight">
      {{ mode === 'login' ? 'Log in' : 'Create your account' }}
    </h2>
    <p class="mt-2 text-sm text-ink-soft dark:text-night-ink-soft">
      {{
        mode === 'login'
          ? 'Find a seat or publish the trip you are already driving.'
          : 'Takes a minute. No car required.'
      }}
    </p>

    <div
      class="mt-8 grid grid-cols-2 gap-1 rounded-card bg-slate-100 p-1 dark:bg-night-raised"
      role="tablist"
    >
      <button
        v-for="tab in ['login', 'register'] as Mode[]"
        :key="tab"
        role="tab"
        type="button"
        class="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200"
        :class="
          mode === tab
            ? 'bg-white text-ink shadow-sm dark:bg-brand-950 dark:text-night-ink'
            : 'text-ink-soft hover:text-ink dark:text-night-ink-soft dark:hover:text-night-ink'
        "
        :aria-selected="mode === tab"
        @click="mode = tab"
      >
        {{ tab === 'login' ? 'Log in' : 'Register' }}
      </button>
    </div>

    <form class="mt-6 grid gap-5" @submit.prevent="submit">
      <label v-if="mode === 'register'" class="field">
        <span>Name</span>
        <input v-model="form.name" type="text" autocomplete="name" placeholder="Alice" required />
      </label>

      <label class="field">
        <span>Email</span>
        <input
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
      </label>

      <label class="field">
        <span>Password</span>
        <input
          v-model="form.password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          placeholder="At least 8 characters"
          minlength="8"
          required
        />
      </label>

      <p
        v-if="auth.error"
        class="rounded-card bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
        role="alert"
      >
        {{ auth.error }}
      </p>

      <button class="btn btn-primary" type="submit" :disabled="auth.pending">
        {{ auth.pending ? 'Working' : mode === 'login' ? 'Log in' : 'Create account' }}
      </button>

      <template v-if="USE_MOCK_API">
        <div class="flex items-center gap-4 text-xs text-ink-soft dark:text-night-ink-soft">
          <span class="h-px flex-1 bg-line dark:bg-night-line"></span>
          or
          <span class="h-px flex-1 bg-line dark:bg-night-line"></span>
        </div>

        <button class="btn btn-ghost" type="button" @click="fillDemo">Use demo account</button>
      </template>
    </form>
  </div>
</template>
