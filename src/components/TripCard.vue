<script setup lang="ts">
/**
 * TripCard.vue
 *
 * Demonstrates:
 * 1. defineProps: Receiving typed data from a parent component.
 * 2. computed(): Creating lightweight derived state (e.g. available seats, formatted dates).
 */
import { computed, ref } from 'vue'
import type { TripWithDriver } from '@/types'
import { useBookingsStore } from '@/stores/bookings'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/UserAvatar.vue'
import RouteLine from '@/components/RouteLine.vue'
import { formatDeparture } from '@/utils/format'

// defineProps is a Vue compiler macro (no need to import it).
// It defines what data this child component expects from its parent.
const props = defineProps<{
  trip: TripWithDriver
}>()

// Emit a `reserve` event with the trip data when the user clicks "Reserve ride".
// A parent (or future handler) can listen with @reserve="onReserve".
const emit = defineEmits<{
  (e: 'reserve', trip: TripWithDriver): void
  (e: 'booked'): void
}>()

const bookingsStore = useBookingsStore()
const auth = useAuthStore()

// ── Inline booking widget state ───────────────────────────────────────────
/** null = collapsed, 'form' = seat picker, 'done' = success confirmation */
const bookingState = ref<null | 'form' | 'done'>(null)
const seatCount = ref(1)
const bookingError = ref<string | null>(null)

// Computed property: automatically updates if props.trip changes
const seatsLeft = computed(() => props.trip.seatsTotal - props.trip.seatsBooked)

const formattedDate = computed(() => formatDeparture(props.trip.departureAt))

function openBooking() {
  seatCount.value = 1
  bookingError.value = null
  bookingState.value = 'form'
}

function closeBooking() {
  bookingState.value = null
  bookingError.value = null
}

async function submitBooking() {
  bookingError.value = null
  const result = await bookingsStore.create(props.trip.id, { seats: seatCount.value })
  if (result) {
    bookingState.value = 'done'
    emit('booked')
  } else {
    bookingError.value = bookingsStore.error
  }
}
</script>

<template>
  <!--
    Single card displaying driver and trip details.
    Built from the shared classes in main.css (.card, .badge, .meta); see DESIGN.md.
  -->
  <article class="rise card">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- DRIVER DETAILS -->
      <div class="flex items-center gap-3.5">
        <UserAvatar :name="trip.driver.name" />

        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-medium text-ink dark:text-night-ink">{{ trip.driver.name }}</h3>
            <span v-if="(trip.driver.rating ?? 0) > 0" class="badge badge-neutral">
              ★ {{ (trip.driver.rating ?? 0).toFixed(1) }}
              <span class="text-[0.6875rem]">({{ trip.driver.ratingCount }})</span>
            </span>
          </div>

          <p class="meta">Departing {{ formattedDate }}</p>
        </div>
      </div>

      <!-- PRICE & SEATS AVAILABILITY -->
      <div class="flex items-baseline justify-between sm:flex-col sm:items-end sm:justify-center">
        <div class="text-lg font-medium tracking-tight text-ink dark:text-night-ink">
          {{ trip.pricePerSeat }} {{ trip.currency }}
          <span class="meta font-normal">/ seat</span>
        </div>

        <span class="badge" :class="seatsLeft > 0 ? 'badge-success' : 'badge-danger'">
          {{ seatsLeft > 0 ? `${seatsLeft} seats left` : 'Fully booked' }}
        </span>
      </div>
    </div>

    <!-- ROUTE & NOTES -->
    <div
      class="mt-4 border-t border-line pt-3 text-sm text-ink-soft dark:border-night-line dark:text-night-ink-soft"
    >
      <RouteLine :origin="trip.origin" :destination="trip.destination" />

      <p v-if="trip.notes" class="meta mt-1.5 line-clamp-2">
        {{ trip.notes }}
      </p>
    </div>

    <!-- BOOKING WIDGET -->
    <div class="mt-4 border-t border-line pt-4 dark:border-night-line">
      <!-- Logged-out: keep original reserve emit -->
      <template v-if="!auth.isAuthenticated">
        <button
          type="button"
          class="btn btn-primary w-full"
          :disabled="seatsLeft <= 0"
          @click="emit('reserve', trip)"
        >
          {{ seatsLeft > 0 ? 'Reserve ride' : 'Fully booked' }}
        </button>
      </template>

      <!-- Success confirmation -->
      <template v-else-if="bookingState === 'done'">
        <p id="trip-card-booking-success" class="alert alert-success">
          ✓ Booked! Check
          <router-link :to="{ name: 'bookings' }" class="font-medium underline"
            >My bookings</router-link
          >
          to manage it.
        </p>
      </template>

      <!-- Seat picker form -->
      <template v-else-if="bookingState === 'form'">
        <div class="flex flex-col gap-3">
          <label class="field">
            <span>Seats to book</span>
            <input
              id="trip-card-seat-input"
              v-model.number="seatCount"
              type="number"
              min="1"
              :max="seatsLeft"
            />
          </label>

          <p v-if="bookingError" class="alert alert-error" role="alert">
            {{ bookingError }}
          </p>

          <div class="flex gap-3">
            <button
              id="trip-card-book-confirm-btn"
              type="button"
              class="btn btn-primary flex-1"
              :disabled="bookingsStore.pending"
              @click="submitBooking"
            >
              {{
                bookingsStore.pending
                  ? 'Booking…'
                  : `Book ${seatCount} seat${seatCount === 1 ? '' : 's'}`
              }}
            </button>
            <button
              id="trip-card-book-cancel-btn"
              type="button"
              class="btn btn-ghost"
              :disabled="bookingsStore.pending"
              @click="closeBooking"
            >
              Cancel
            </button>
          </div>
        </div>
      </template>

      <!-- Default: "Book a seat" button -->
      <template v-else>
        <button
          id="trip-card-book-btn"
          type="button"
          class="btn btn-primary w-full"
          :disabled="seatsLeft <= 0"
          @click="openBooking"
        >
          {{ seatsLeft > 0 ? 'Book a seat' : 'Fully booked' }}
        </button>
      </template>
    </div>
  </article>
</template>
