<script setup lang="ts">
import { RouterView } from 'vue-router'
import TopNav from '@/components/TopNav.vue'
</script>

<template>
  <div class="min-h-dvh bg-white dark:bg-night">
    <TopNav />
    <main class="mx-auto max-w-5xl px-6 py-16">
      <RouterView />
    </main>
  </div>
</template>
