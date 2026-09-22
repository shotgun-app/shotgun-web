<script setup lang="ts">
/**
 * TripCard.vue
 *
 * Demonstrates:
 * 1. defineProps: Receiving typed data from a parent component.
 * 2. computed(): Creating lightweight derived state (e.g. available seats, formatted dates).
 */
import { computed } from 'vue'
import type { TripWithDriver } from '@/types'

// defineProps is a Vue compiler macro (no need to import it).
// It defines what data this child component expects from its parent.
const props = defineProps<{
  trip: TripWithDriver
}>()

// Emit a `reserve` event with the trip data when the user clicks "Reserve Ride".
// A parent (or future handler) can listen with @reserve="onReserve".
const emit = defineEmits<{
  (e: 'reserve', trip: TripWithDriver): void
}>()

// Computed property: automatically updates if props.trip changes
const seatsLeft = computed(() => props.trip.seatsTotal - props.trip.seatsBooked)

const formattedDate = computed(() => {
  try {
    const d = new Date(props.trip.departureAt)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return props.trip.departureAt
  }
})

// Driver initials for avatar avatar chip
const driverInitials = computed(() => {
  const parts = props.trip.driver.name.trim().split(/\s+/)
  const first = parts[0]?.[0]
  const second = parts[1]?.[0]
  if (first && second) {
    return `${first}${second}`.toUpperCase()
  }
  return props.trip.driver.name.slice(0, 2).toUpperCase() || 'DR'
})
</script>

<template>
  <!--
    Single card displaying driver and trip details.
    Uses Tailwind classes adhering to the project's design system tokens:
    rounded-card (12px), border-line, dark:border-night-line, etc.
  -->
  <article
    class="rise rounded-card border border-line bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-night-line dark:bg-night-raised"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- DRIVER DETAILS -->
      <div class="flex items-center gap-3.5">
        <!-- Avatar Circle -->
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-400"
          aria-hidden="true"
        >
          {{ driverInitials }}
        </div>

        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-medium text-ink dark:text-night-ink">{{ trip.driver.name }}</h3>
            <span
              v-if="trip.driver.rating > 0"
              class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-ink-soft dark:bg-night dark:text-night-ink-soft"
            >
              ★ {{ trip.driver.rating.toFixed(1) }}
              <span class="text-[0.6875rem]">({{ trip.driver.ratingCount }})</span>
            </span>
          </div>

          <p class="text-xs text-ink-soft dark:text-night-ink-soft">
            Departing {{ formattedDate }}
          </p>
        </div>
      </div>

      <!-- PRICE & SEATS AVAILABILITY -->
      <div class="flex items-baseline justify-between sm:flex-col sm:items-end sm:justify-center">
        <div class="text-lg font-semibold tracking-tight text-ink dark:text-night-ink">
          {{ trip.pricePerSeat }} {{ trip.currency }}
          <span class="text-xs font-normal text-ink-soft dark:text-night-ink-soft">/ seat</span>
        </div>

        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          :class="
            seatsLeft > 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
          "
        >
          {{ seatsLeft > 0 ? `${seatsLeft} seats left` : 'Fully booked' }}
        </span>
      </div>
    </div>

    <!-- ROUTE & NOTES -->
    <div
      class="mt-4 border-t border-line/60 pt-3 text-sm text-ink-soft dark:border-night-line/60 dark:text-night-ink-soft"
    >
      <div class="flex items-center gap-2 font-medium text-ink dark:text-night-ink">
        <span>{{ trip.origin }}</span>
        <span class="text-brand-600 dark:text-brand-400">→</span>
        <span>{{ trip.destination }}</span>
      </div>

      <p v-if="trip.notes" class="mt-1.5 text-xs line-clamp-2">
        {{ trip.notes }}
      </p>
    </div>
    
    <!-- RESERVE ACTION -->
    <div class="mt-4 border-t border-line/60 pt-4 dark:border-night-line/60">
      <button
        type="button"
        class="btn btn-primary w-full"
        :disabled="seatsLeft <= 0"
        @click="emit('reserve', trip)"
      >
        {{ seatsLeft > 0 ? 'Reserve Ride' : 'Fully Booked' }}
      </button>
    </div>

  </article>
</template>
