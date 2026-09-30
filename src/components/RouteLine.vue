<script setup lang="ts">
defineProps<{ origin: string; destination: string }>()
</script>

<template>
  <div class="flex items-center gap-2 font-medium text-ink dark:text-night-ink">
    <span>{{ origin }}</span>
    <span class="text-brand-600 dark:text-brand-400" aria-hidden="true">→</span>
    <span>{{ destination }}</span>
  </div>
</template>
