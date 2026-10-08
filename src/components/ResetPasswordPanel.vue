<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PasswordInput from './PasswordInput.vue'

const auth = useAuthStore()
const route = useRoute()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})
const password = ref('')
const done = ref(false)
/** Checked against the API on load, so a dead link never shows the form. */
const link = ref<'checking' | 'valid' | 'invalid'>('checking')

auth.error = null

onMounted(async () => {
  link.value = (await auth.isResetTokenValid(token.value)) ? 'valid' : 'invalid'
})

async function submit() {
  done.value = await auth.resetPassword({ token: token.value, password: password.value })
}
</script>

<template>
  <div class="w-full max-w-sm">
    <p class="flex items-center gap-3 text-xl font-medium tracking-tight">
      <img src="/logo.png" alt="" class="size-10" width="40" height="40" />
      Shotgun
    </p>

    <template v-if="done">
      <h2 class="mt-8 text-3xl font-medium tracking-tight">Password updated</h2>
      <p class="alert alert-success mt-6" role="status">
        Your password is changed and you are logged out everywhere. Log in with the new one.
      </p>
      <RouterLink :to="{ name: 'landing' }" class="btn btn-primary mt-6 w-full py-3">
        Log in
      </RouterLink>
    </template>

    <template v-else-if="link === 'checking'">
      <h2 class="mt-8 text-3xl font-medium tracking-tight">Checking your link</h2>
      <p class="mt-2 text-sm text-ink-soft dark:text-night-ink-soft" role="status">One moment.</p>
    </template>

    <template v-else-if="link === 'invalid'">
      <h2 class="mt-8 text-3xl font-medium tracking-tight">Link not valid</h2>
      <p class="alert alert-error mt-6" role="alert">
        This reset link is invalid or has expired. Links work once and last 30 minutes.
      </p>
      <RouterLink
        :to="{ name: 'landing', query: { forgot: null } }"
        class="btn btn-primary mt-6 w-full py-3"
      >
        Request a new link
      </RouterLink>
    </template>

    <template v-else>
      <h2 class="mt-8 text-3xl font-medium tracking-tight">Choose a new password</h2>
      <p class="mt-2 text-sm text-ink-soft dark:text-night-ink-soft">
        Pick something you have not used here before. At least 8 characters.
      </p>

      <form class="mt-6 grid gap-5" @submit.prevent="submit">
        <label class="field">
          <span>New password</span>
          <PasswordInput
            v-model="password"
            autocomplete="new-password"
            placeholder="At least 8 characters"
            :minlength="8"
            required
          />
        </label>

        <p v-if="auth.error" class="alert alert-error" role="alert">
          {{ auth.error }}
        </p>

        <button class="btn btn-primary mt-1 py-3" type="submit" :disabled="auth.pending">
          {{ auth.pending ? 'Working' : 'Update password' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm">
        <RouterLink
          :to="{ name: 'landing' }"
          class="rounded font-medium text-brand-600 underline-offset-4 transition-colors duration-200 hover:underline dark:text-brand-400"
        >
          Back to log in
        </RouterLink>
      </p>
    </template>
  </div>
</template>
