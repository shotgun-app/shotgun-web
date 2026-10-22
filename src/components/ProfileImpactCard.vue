<script setup lang="ts">
import { PhLeaf, PhPath } from '@phosphor-icons/vue'
import type { ProfileImpact } from '@/types'
import { formatCo2 } from '@/utils/format'

// Generic over the role so the driver profile can reuse it with its own title and labels
defineProps<{
  title: string
  impact: ProfileImpact
  ridesLabel: string
  co2Hint: string
  subHint?: string
}>()
</script>

<template>
  <section
    class="rounded-card border border-line bg-white p-6 dark:border-night-line dark:bg-night-raised"
  >
    <h2 class="section-title">{{ title }}</h2>

    <dl class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div class="rounded-lg border border-line p-4 dark:border-night-line">
        <dt class="flex items-center gap-1.5 text-sm text-ink-soft dark:text-night-ink-soft">
          <PhLeaf :size="16" aria-hidden="true" class="text-accent-600 dark:text-accent-400" />
          CO₂ saved
        </dt>
        <dd data-test="impact-co2" class="mt-2 text-2xl font-medium tracking-tight">
          {{ formatCo2(impact.co2SavedKg) }}
        </dd>
        <dd class="meta mt-1">{{ co2Hint }}</dd>
      </div>

      <div class="rounded-lg border border-line p-4 dark:border-night-line">
        <dt class="flex items-center gap-1.5 text-sm text-ink-soft dark:text-night-ink-soft">
          <PhPath :size="16" aria-hidden="true" />
          {{ ridesLabel }}
        </dt>
        <dd data-test="impact-rides" class="mt-2 text-2xl font-medium tracking-tight">
          {{ impact.rides }}
        </dd>
        <dd class="meta mt-1">{{ subHint || 'Completed rides only.' }}</dd>
      </div>
    </dl>
  </section>
</template>
