<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ email: string }>()
defineEmits<{ back: [] }>()

const auth = useAuthStore()
const email = ref(props.email)
const sentTo = ref<string | null>(null)

async function submit() {
  const address = email.value.trim()
  if (await auth.requestPasswordReset(address)) sentTo.value = address
}
</script>

<template>
  <h2 class="mt-8 text-3xl font-medium tracking-tight">Forgot your password?</h2>
  <p class="mt-2 text-sm text-ink-soft dark:text-night-ink-soft">
    Enter your email and we will send you a link to choose a new one.
  </p>

  <p v-if="sentTo" class="alert alert-success mt-6" role="status">
    If an account exists for {{ sentTo }}, a reset link is on its way. It is valid for 30 minutes.
  </p>

  <form v-else class="mt-6 grid gap-5" @submit.prevent="submit">
    <label class="field">
      <span>Email</span>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />
    </label>

    <p v-if="auth.error" class="alert alert-error" role="alert">
      {{ auth.error }}
    </p>

    <button class="btn btn-primary mt-1 py-3" type="submit" :disabled="auth.pending">
      {{ auth.pending ? 'Working' : 'Send reset link' }}
    </button>
  </form>

  <p class="mt-4 text-center text-sm">
    <button
      type="button"
      class="cursor-pointer rounded font-medium text-brand-600 underline-offset-4 transition-colors duration-200 hover:underline dark:text-brand-400"
      @click="$emit('back')"
    >
      Back to log in
    </button>
  </p>
</template>
