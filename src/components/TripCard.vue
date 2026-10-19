<script setup lang="ts">
/**
 * TripCard.vue
 *
 * Demonstrates:
 * 1. defineProps: Receiving typed data from a parent component.
 * 2. computed(): Creating lightweight derived state (e.g. available seats, formatted dates).
 */
import { computed, ref } from 'vue'
import { PhLeaf, PhStar } from '@phosphor-icons/vue'
import type { TripWithDriver } from '@/types'
import { useBookingsStore } from '@/stores/bookings'
import SeatStepper from '@/components/SeatStepper.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import RouteLine from '@/components/RouteLine.vue'
import { formatDeparture, formatCo2 } from '@/utils/format'
import {
  LARGE_BAG_HINT,
  SMALL_BAG_HINT,
  bagSpaceLabel,
  largeBagsLeft,
  smallBagsLeft,
} from '@/utils/baggage'

// defineProps: compiler macro (no need to import it).
// It defines what data this child component expects from its parent.
const props = defineProps<{
  trip: TripWithDriver
}>()

const emit = defineEmits<{
  (e: 'booked'): void
}>()

const bookingsStore = useBookingsStore()

// ── Inline booking widget state ───────────────────────────────────────────
/** null = collapsed, 'form' = seat picker, 'done' = success confirmation */
const bookingState = ref<null | 'form' | 'done'>(null)
const seatCount = ref(1)
const smallBagCount = ref(0)
const largeBagCount = ref(0)
const bookingError = ref<string | null>(null)

// Computed property: automatically updates if props.trip changes
const seatsLeft = computed(() => props.trip.seatsTotal - props.trip.seatsBooked)

/** "2 of 4 seats left": shows the car's capacity as well as what is free. */
const seatsLabel = computed(() =>
  seatsLeft.value > 0
    ? `${seatsLeft.value} of ${props.trip.seatsTotal} seat${props.trip.seatsTotal === 1 ? '' : 's'} left`
    : 'Fully booked',
)

const smallLeft = computed(() => smallBagsLeft(props.trip))
const largeLeft = computed(() => largeBagsLeft(props.trip))
const bagSpace = computed(() => bagSpaceLabel(props.trip))

const formattedDate = computed(() => formatDeparture(props.trip.departureAt))

const distance = computed(() => props.trip.distanceKm ?? props.trip.distance_km)

const isElectric = computed(() =>
  Boolean(props.trip.isElectric ?? props.trip.is_electric ?? props.trip.driver?.car?.co2 === 0),
)

const co2Consumed = computed(() => {
  const direct = props.trip.co2ConsumedKg ?? props.trip.co2_consumed_kg
  if (direct !== undefined) return direct
  if (distance.value !== undefined) {
    if (isElectric.value) return 0
    const co2PerKm = props.trip.driver?.car?.co2 ?? 120
    return Math.round(((distance.value * co2PerKm) / 1000) * 10) / 10
  }
  return undefined
})

const co2Saved = computed(() => {
  const direct = props.trip.co2SavedKg ?? props.trip.co2_saved_kg
  if (direct !== undefined) return direct
  if (distance.value !== undefined && co2Consumed.value !== undefined) {
    const individualBaseline = (distance.value * 120) / 1000
    const passengersTotal = (props.trip.seatsBooked ?? 0) + 1
    const saved = individualBaseline - co2Consumed.value / passengersTotal
    return Math.round(Math.max(0, saved) * 10) / 10
  }
  return undefined
})

const ecoConsumedText = computed(() => {
  if (isElectric.value) {
    return '0 kg CO₂ (Electric)'
  }
  if (co2Consumed.value !== undefined) {
    return formatCo2(co2Consumed.value)
  }
  return null
})

const hasEcoInfo = computed(
  () =>
    Boolean(isElectric.value) ||
    co2Consumed.value !== undefined ||
    (co2Saved.value !== undefined && co2Saved.value > 0),
)

function openBooking() {
  seatCount.value = 1
  smallBagCount.value = 0
  largeBagCount.value = 0
  bookingError.value = null
  bookingState.value = 'form'
}

function closeBooking() {
  bookingState.value = null
  bookingError.value = null
}

async function submitBooking() {
  bookingError.value = null
  const result = await bookingsStore.create(props.trip.id, {
    seats: seatCount.value,
    smallBags: smallBagCount.value,
    largeBags: largeBagCount.value,
  })
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
        <UserAvatar :name="trip.driver.name" :src="trip.driver.avatarUrl" />

        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-medium text-ink dark:text-night-ink">{{ trip.driver.name }}</h3>
            <span v-if="(trip.driver.rating ?? 0) > 0" class="badge badge-neutral">
              <PhStar :size="12" weight="fill" aria-hidden="true" />
              {{ (trip.driver.rating ?? 0).toFixed(1) }}
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
          {{ seatsLabel }}
        </span>
        <span
          :id="`trip-card-bags-${trip.id}`"
          class="badge mt-1"
          :class="bagSpace.full ? 'badge-neutral' : 'badge-success'"
        >
          {{ bagSpace.text }}
        </span>
      </div>
    </div>

    <!-- ROUTE & NOTES -->
    <div
      class="mt-4 border-t border-line pt-3 text-sm text-ink-soft dark:border-night-line dark:text-night-ink-soft"
    >
      <div class="flex items-center justify-between gap-2">
        <RouteLine :origin="trip.originCity" :destination="trip.destinationCity" />
        <span
          v-if="distance !== undefined"
          :id="`trip-card-distance-${trip.id}`"
          class="badge badge-neutral font-medium"
        >
          {{ distance }} km
        </span>
      </div>

      <p v-if="trip.notes" class="meta mt-1.5 line-clamp-2">
        {{ trip.notes }}
      </p>
    </div>

    <!-- ENVIRONMENTAL IMPACT -->
    <div
      v-if="hasEcoInfo"
      :id="`trip-card-eco-${trip.id}`"
      class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-card border border-accent-100 bg-accent-100/40 px-3.5 py-2.5 text-xs dark:border-accent-700/30 dark:bg-accent-700/10"
      aria-label="Environmental impact"
    >
      <div
        class="inline-flex items-center gap-1.5 font-medium text-accent-700 dark:text-accent-400"
      >
        <PhLeaf :size="16" weight="fill" aria-hidden="true" />
        <span>{{ ecoConsumedText }}</span>
      </div>

      <div
        v-if="co2Saved !== undefined && co2Saved > 0"
        :id="`trip-card-saved-${trip.id}`"
        class="badge badge-success"
      >
        Saves ~{{ formatCo2(co2Saved) }} vs driving alone
      </div>
    </div>

    <!-- BOOKING WIDGET -->
    <div class="mt-4 border-t border-line pt-4 dark:border-night-line">
      <!-- Success confirmation -->
      <template v-if="bookingState === 'done'">
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
          <div class="field">
            <span>Seats to book</span>
            <div class="flex items-center gap-3">
              <SeatStepper
                id="trip-card-seat-input"
                v-model="seatCount"
                label="Seats to book"
                :min="1"
                :max="seatsLeft"
              />
              <span class="meta">of {{ seatsLeft }} available</span>
            </div>
          </div>

          <div v-if="smallLeft > 0 || largeLeft > 0" class="grid gap-3 sm:grid-cols-2">
            <div v-if="smallLeft > 0" class="field">
              <span>Small bags</span>
              <div class="flex items-center gap-3">
                <SeatStepper
                  id="trip-card-small-bags-input"
                  v-model="smallBagCount"
                  label="Small bags"
                  :min="0"
                  :max="smallLeft"
                />
                <span class="meta">{{ smallLeft }} available</span>
              </div>
              <p class="meta">{{ SMALL_BAG_HINT }}</p>
            </div>

            <div v-if="largeLeft > 0" class="field">
              <span>Large bags</span>
              <div class="flex items-center gap-3">
                <SeatStepper
                  id="trip-card-large-bags-input"
                  v-model="largeBagCount"
                  label="Large bags"
                  :min="0"
                  :max="largeLeft"
                />
                <span class="meta">{{ largeLeft }} available</span>
              </div>
              <p class="meta">{{ LARGE_BAG_HINT }}</p>
            </div>
          </div>

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
