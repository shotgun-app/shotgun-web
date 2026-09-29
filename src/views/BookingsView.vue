<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import SeatStepper from '@/components/SeatStepper.vue'
import RouteLine from '@/components/RouteLine.vue'
import { formatDeparture } from '@/utils/format'
import type { BookingWithTrip } from '@/types'

const bookings = useBookingsStore()

onMounted(() => {
  bookings.fetchMine()
})

// ── Edit (seat change) state ───────────────────────────────────────────────
/** id of the booking currently being edited, or null */
const editingId = ref<string | null>(null)
const editSeats = ref(1)
const editError = ref<string | null>(null)

function openEdit(b: BookingWithTrip) {
  editingId.value = b.id
  editSeats.value = b.seats
  editError.value = null
  bookings.error = null
}

function closeEdit() {
  editingId.value = null
  editError.value = null
  bookings.error = null
}

async function submitEdit(bookingId: string) {
  editError.value = null
  if (!Number.isInteger(editSeats.value) || editSeats.value < 1) {
    editError.value = 'You must book at least 1 seat.'
    return
  }
  const ok = await bookings.update(bookingId, { seats: editSeats.value })
  if (ok) closeEdit()
  else editError.value = bookings.error
}

// ── Cancel confirmation state ──────────────────────────────────────────────
const confirmingCancelId = ref<string | null>(null)

function requestCancel(id: string) {
  confirmingCancelId.value = id
}

function dismissCancel() {
  confirmingCancelId.value = null
}

async function confirmCancel(id: string) {
  const ok = await bookings.cancel(id)
  if (ok) confirmingCancelId.value = null
}

// ── Display helpers ────────────────────────────────────────────────────────
function seatsLeft(b: BookingWithTrip): number {
  return b.trip.seatsTotal - b.trip.seatsBooked + b.seats
}
</script>

<template>
  <section class="rise max-w-2xl">
    <!-- ── Page header ────────────────────────────────────────────────── -->
    <div>
      <h1 class="page-title">My bookings</h1>
      <p class="page-lead">Rides you've booked as a passenger.</p>
    </div>

    <!-- ── API error ──────────────────────────────────────────────────── -->
    <p
      v-if="bookings.error && editingId === null && confirmingCancelId === null"
      class="alert alert-error mt-8"
      role="alert"
    >
      {{ bookings.error }}
    </p>

    <!-- ── Loading state ──────────────────────────────────────────────── -->
    <p v-if="bookings.pending && bookings.bookings.length === 0" class="meta mt-10 text-sm">
      Loading your bookings…
    </p>

    <!-- ── Empty state ────────────────────────────────────────────────── -->
    <div v-else-if="bookings.bookings.length === 0" id="bookings-empty" class="empty mt-10">
      <p class="meta mt-1.5 text-sm">You have no bookings yet.</p>
      <RouterLink :to="{ name: 'app' }" class="btn btn-primary mt-5">Search for a ride</RouterLink>
    </div>

    <!-- ── Booking list ───────────────────────────────────────────────── -->
    <ul v-else class="mt-10 grid gap-4">
      <li
        v-for="booking in bookings.bookings"
        :id="`booking-card-${booking.id}`"
        :key="booking.id"
        class="card"
      >
        <!-- Trip summary row -->
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <RouteLine :origin="booking.trip.origin" :destination="booking.trip.destination" />
            <p class="meta mt-1">Departing {{ formatDeparture(booking.trip.departureAt) }}</p>
            <p class="meta mt-0.5">
              {{ booking.seats }} seat{{ booking.seats === 1 ? '' : 's' }} booked ·
              {{ booking.trip.pricePerSeat }} {{ booking.trip.currency }} / seat
            </p>
          </div>

          <!-- Actions: normal state -->
          <div
            v-if="editingId !== booking.id && confirmingCancelId !== booking.id"
            class="flex items-center gap-2"
          >
            <button
              :id="`booking-edit-btn-${booking.id}`"
              type="button"
              class="btn btn-ghost"
              @click="openEdit(booking)"
            >
              Change seats
            </button>
            <button
              :id="`booking-cancel-btn-${booking.id}`"
              type="button"
              class="btn btn-danger"
              @click="requestCancel(booking.id)"
            >
              Cancel booking
            </button>
          </div>
        </div>

        <!-- ── Edit form (inline) ─────────────────────────────────────── -->
        <div
          v-if="editingId === booking.id"
          class="mt-4 border-t border-line pt-4 dark:border-night-line"
        >
          <form
            :id="`booking-edit-form-${booking.id}`"
            class="flex flex-col gap-3"
            @submit.prevent="submitEdit(booking.id)"
          >
            <div class="field">
              <span>Number of seats</span>
              <div class="flex items-center gap-3">
                <SeatStepper
                  :id="`booking-edit-seats-${booking.id}`"
                  v-model="editSeats"
                  label="Number of seats"
                  :min="1"
                  :max="seatsLeft(booking)"
                />
                <span class="meta">of {{ seatsLeft(booking) }} available</span>
              </div>
            </div>
            <p v-if="editError" class="alert alert-error" role="alert">
              {{ editError }}
            </p>
            <div class="flex gap-3">
              <button
                :id="`booking-edit-save-btn-${booking.id}`"
                type="submit"
                class="btn btn-primary"
                :disabled="bookings.pending"
              >
                {{ bookings.pending ? 'Saving…' : 'Save' }}
              </button>
              <button
                :id="`booking-edit-cancel-btn-${booking.id}`"
                type="button"
                class="btn btn-ghost"
                :disabled="bookings.pending"
                @click="closeEdit"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- ── Cancel confirmation ────────────────────────────────────── -->
        <div
          v-if="confirmingCancelId === booking.id"
          class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4 dark:border-night-line"
        >
          <span class="text-sm font-medium text-red-600 dark:text-red-400">
            Cancel this booking?
          </span>
          <button
            :id="`booking-cancel-confirm-btn-${booking.id}`"
            type="button"
            class="btn btn-danger-solid"
            :disabled="bookings.pending"
            @click="confirmCancel(booking.id)"
          >
            {{ bookings.pending ? 'Cancelling…' : 'Yes, cancel' }}
          </button>
          <button
            :id="`booking-cancel-dismiss-btn-${booking.id}`"
            type="button"
            class="btn btn-ghost"
            :disabled="bookings.pending"
            @click="dismissCancel"
          >
            Keep booking
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
