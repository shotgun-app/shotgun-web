<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section class="rise">
    <h1 class="text-3xl font-medium tracking-tight">Hi {{ auth.user?.name }}.</h1>
    <p class="mt-3 max-w-md text-ink-soft dark:text-night-ink-soft">
      Trip search, trip creation and bookings arrive in later sprints.
    </p>

    <div
      class="mt-12 rounded-card border border-dashed border-line px-6 py-20 text-center dark:border-night-line"
    >
      <p class="text-sm font-medium">Nothing here yet</p>
      <p class="mx-auto mt-1.5 max-w-xs text-sm text-ink-soft dark:text-night-ink-soft">
        Authentication is the only feature implemented in this sprint.
      </p>
    </div>
  </section>
</template>
