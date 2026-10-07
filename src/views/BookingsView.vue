<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import SeatStepper from '@/components/SeatStepper.vue'
import RouteLine from '@/components/RouteLine.vue'
import UserList from '@/components/UserList.vue'
import { formatDeparture } from '@/utils/format'
import type { BookingWithTrip, PublicUser } from '@/types'

const bookings = useBookingsStore()

onMounted(() => {
  bookings.fetchMine()
})

// ── Upcoming / completed bookings ─────────────────────────────────────────

const upcomingBookings = computed(() =>
  bookings.bookings.filter((booking) => new Date(booking.trip.departureAt) >= new Date()),
)

const completedBookings = computed(() =>
  bookings.bookings.filter((booking) => new Date(booking.trip.departureAt) < new Date()),
)

const completedOpen = ref(false)

// ── Review modal state ─────────────────────────────────────────────────────

const reviewingBooking = ref<BookingWithTrip | null>(null)
const reviewRating = ref(0)
const reviewComment = ref('')
const reviewError = ref<string | null>(null)
const reviewSubmitting = ref(false)

function openReview(booking: BookingWithTrip) {
  reviewingBooking.value = booking
  reviewRating.value = 0
  reviewComment.value = ''
  reviewError.value = null
}

function closeReview() {
  if (reviewSubmitting.value) return

  reviewingBooking.value = null
  reviewRating.value = 0
  reviewComment.value = ''
  reviewError.value = null
}

async function submitReview() {
  if (!reviewingBooking.value || reviewRating.value === 0) return

  reviewSubmitting.value = true
  reviewError.value = null

  const success = await bookings.review({
    rideId: reviewingBooking.value.trip.id,
    rating: reviewRating.value,
    comment: reviewComment.value.trim(),
  })

  reviewSubmitting.value = false

  if (!success) {
    reviewError.value = bookings.error ?? 'Something went wrong. Try again.'
    return
  }

  closeReview()
}

// ── Edit (seat change) state ───────────────────────────────────────────────

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

function otherPassengers(b: BookingWithTrip): PublicUser[] {
  return b.trip.passengers.filter((p) => p.id !== b.passengerId)
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

      <RouterLink :to="{ name: 'app' }" class="btn btn-primary mt-5">
        Search for a ride
      </RouterLink>
    </div>

    <!-- ── Bookings ───────────────────────────────────────────────────── -->
    <template v-else>
      <!-- ── Upcoming bookings ────────────────────────────────────────── -->
      <ul v-if="upcomingBookings.length > 0" class="mt-10 grid gap-4">
        <li
          v-for="booking in upcomingBookings"
          :id="`booking-card-${booking.id}`"
          :key="booking.id"
          class="card"
        >
          <!-- Trip summary row -->
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <RouteLine
                :origin="booking.trip.originCity"
                :destination="booking.trip.destinationCity"
              />

              <p class="meta mt-1">
                Departing {{ formatDeparture(booking.trip.departureAt) }}
              </p>

              <p class="meta mt-0.5">
                {{ booking.seats }} seat{{ booking.seats === 1 ? '' : 's' }} booked ·
                {{ booking.trip.pricePerSeat }} {{ booking.trip.currency }} / seat
              </p>
            </div>

            <!-- Actions -->
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

          <!-- Who's on the ride -->
          <dl class="mt-4 grid gap-2 border-t border-line pt-4 dark:border-night-line">
            <div class="grid grid-cols-[7rem_1fr] items-center gap-4">
              <dt class="meta">Driver</dt>

              <dd class="min-w-0">
                <UserList :users="[booking.trip.driver]" />
              </dd>
            </div>

            <div class="grid grid-cols-[7rem_1fr] items-center gap-4">
              <dt class="meta">Other passengers</dt>

              <dd class="min-w-0">
                <UserList
                  :users="otherPassengers(booking)"
                  empty="No other passengers"
                />
              </dd>
            </div>
          </dl>

          <!-- Edit form -->
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

                  <span class="meta">
                    of {{ seatsLeft(booking) }} available
                  </span>
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

          <!-- Cancel confirmation -->
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

            <p v-if="bookings.error" class="alert alert-error w-full" role="alert">
              {{ bookings.error }}
            </p>
          </div>
        </li>
      </ul>

      <!-- ── Completed rides ─────────────────────────────────────────── -->
      <section v-if="completedBookings.length > 0" class="mt-10">
        <button
          type="button"
          class="flex w-full items-center justify-between border-b border-line pb-3 text-left dark:border-night-line"
          :aria-expanded="completedOpen"
          @click="completedOpen = !completedOpen"
        >
          <span class="section-title">Completed rides</span>

          <span class="meta">
            {{ completedOpen ? 'Hide' : 'Show' }}
          </span>
        </button>

        <ul v-if="completedOpen" class="mt-4 grid gap-4">
          <li
            v-for="booking in completedBookings"
            :id="`completed-booking-card-${booking.id}`"
            :key="booking.id"
            class="card"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <RouteLine
                  :origin="booking.trip.originCity"
                  :destination="booking.trip.destinationCity"
                />

                <p class="meta mt-1">
                  Departed {{ formatDeparture(booking.trip.departureAt) }}
                </p>

                <p class="meta mt-0.5">
                  {{ booking.seats }} seat{{ booking.seats === 1 ? '' : 's' }} booked ·
                  {{ booking.trip.pricePerSeat }} {{ booking.trip.currency }} / seat
                </p>
              </div>

              <!-- Rate button -->
              <button
                v-if="!booking.reviewed"
                :id="`booking-rate-btn-${booking.id}`"
                type="button"
                class="btn btn-primary"
                @click="openReview(booking)"
              >
                Rate
              </button>
            </div>

            <!-- Driver -->
            <dl class="mt-4 border-t border-line pt-4 dark:border-night-line">
              <div class="grid grid-cols-[7rem_1fr] items-center gap-4">
                <dt class="meta">Driver</dt>

                <dd class="min-w-0">
                  <UserList :users="[booking.trip.driver]" />
                </dd>
              </div>
            </dl>
          </li>
        </ul>
      </section>
    </template>

    <!-- ── Review modal ───────────────────────────────────────────────── -->
    <div
      v-if="reviewingBooking"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div class="card w-full max-w-md">
        <!-- Modal header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="review-modal-title" class="section-title">
              Rate your ride
            </h2>

            <p class="meta mt-1">
              {{ reviewingBooking.trip.driver.name }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-ghost"
            aria-label="Close review"
            :disabled="reviewSubmitting"
            @click="closeReview"
          >
            ×
          </button>
        </div>

        <!-- Stars -->
        <div class="mt-6">
          <p class="meta mb-2">Rating</p>

          <div
            class="flex gap-2"
            role="radiogroup"
            aria-label="Rating"
          >
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              :aria-label="`${star} star${star === 1 ? '' : 's'}`"
              :aria-checked="reviewRating === star"
              role="radio"
              class="text-3xl"
              :disabled="reviewSubmitting"
              @click="reviewRating = star"
            >
              {{ star <= reviewRating ? '★' : '☆' }}
            </button>
          </div>
        </div>

        <!-- Comment -->
        <label class="field mt-6">
          <span>Review</span>

          <textarea
            v-model="reviewComment"
            rows="4"
            maxlength="500"
            placeholder="How was your experience?"
            :disabled="reviewSubmitting"
          ></textarea>
        </label>

        <!-- Review error -->
        <p
          v-if="reviewError"
          class="alert alert-error mt-4"
          role="alert"
        >
          {{ reviewError }}
        </p>

        <!-- Modal actions -->
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="reviewSubmitting"
            @click="closeReview"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="reviewRating === 0 || reviewSubmitting"
            @click="submitReview"
          >
            {{ reviewSubmitting ? 'Submitting…' : 'Submit review' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>