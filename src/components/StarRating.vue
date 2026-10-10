<script setup lang="ts">
import { PhStar } from '@phosphor-icons/vue'

// Whole stars only: an average like 3.6 shows 4 filled, the number next to it carries the detail
defineProps<{
  value: number
  label: string
  size?: number
}>()
</script>

<template>
  <div
    class="flex items-center gap-0.5 text-brand-600 dark:text-brand-400"
    role="img"
    :aria-label="`${label}: ${value.toFixed(1)} out of 5`"
  >
    <PhStar
      v-for="star in 5"
      :key="star"
      :size="size ?? 20"
      :weight="star <= Math.round(value) ? 'fill' : 'regular'"
      aria-hidden="true"
    />
  </div>
</template>
