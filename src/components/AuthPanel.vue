<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PasswordInput from './PasswordInput.vue'
import PhoneInput from './PhoneInput.vue'

type Mode = 'login' | 'register'

const auth = useAuthStore()
const router = useRouter()

const mode = ref<Mode>('login')
const form = reactive({ name: '', email: '', phone: '', password: '' })

const isLogin = computed(() => mode.value === 'login')

function toggleMode() {
  mode.value = isLogin.value ? 'register' : 'login'
  auth.error = null
}

async function submit() {
  if (!isLogin.value && !form.phone) {
    auth.error = 'Enter your phone number.'
    return
  }
  const ok = isLogin.value
    ? await auth.login({ email: form.email, password: form.password })
    : await auth.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })

  if (ok) await router.push({ name: 'app' })
}
</script>

<template>
  <div class="w-full max-w-sm">
    <p class="flex items-center gap-3 text-xl font-medium tracking-tight">
      <img src="/logo.png" alt="" class="size-10" width="40" height="40" />
      Shotgun
    </p>

    <h2 class="mt-8 text-3xl font-medium tracking-tight">
      {{ isLogin ? 'Welcome back' : 'Create your account' }}
    </h2>
    <p class="mt-2 text-sm text-ink-soft dark:text-night-ink-soft">
      {{
        isLogin
          ? 'Log in to find a seat or publish the trip you are already driving.'
          : 'Takes a minute. No car or card required.'
      }}
    </p>

    <form class="mt-6 grid gap-5" @submit.prevent="submit">
      <label v-if="!isLogin" class="field">
        <span>Name</span>
        <input
          v-model="form.name"
          type="text"
          autocomplete="name"
          placeholder="Your name"
          required
        />
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

      <div v-if="!isLogin" class="field">
        <span>Phone</span>
        <PhoneInput id="register-phone" v-model="form.phone" required />
      </div>

      <label class="field">
        <span>Password</span>
        <PasswordInput
          v-model="form.password"
          :autocomplete="isLogin ? 'current-password' : 'new-password'"
          :placeholder="isLogin ? 'Your password' : 'At least 8 characters'"
          :minlength="isLogin ? undefined : 8"
          required
        />
      </label>

      <p v-if="auth.error" class="alert alert-error" role="alert">
        {{ auth.error }}
      </p>

      <p v-if="auth.pending" class="meta">Working…</p>

      <button class="btn btn-primary mt-1 py-3" type="submit" :disabled="auth.pending">
        {{ isLogin ? 'Log in' : 'Create account' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-ink-soft dark:text-night-ink-soft">
      {{ isLogin ? 'New to Shotgun?' : 'Already have an account?' }}
      <button
        type="button"
        class="cursor-pointer rounded font-medium text-brand-600 underline-offset-4 transition-colors duration-200 hover:underline dark:text-brand-400"
        @click="toggleMode"
      >
        {{ isLogin ? 'Create an account' : 'Log in' }}
      </button>
    </p>
  </div>
</template>
