<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section class="rise">
    <h1 class="text-3xl font-medium tracking-tight">My profile</h1>
    <p class="mt-3 max-w-md text-ink-soft dark:text-night-ink-soft">
      Profile editing is its own ticket. These are the fields the session already knows.
    </p>

    <dl class="mt-12 max-w-md">
      <div class="grid grid-cols-[6rem_1fr] gap-4 border-t border-line py-4 dark:border-night-line">
        <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Name</dt>
        <dd class="text-sm">{{ auth.user?.name }}</dd>
      </div>
      <div class="grid grid-cols-[6rem_1fr] gap-4 border-t border-line py-4 dark:border-night-line">
        <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Email</dt>
        <dd class="text-sm">{{ auth.user?.email }}</dd>
      </div>
    </dl>
  </section>
</template>
