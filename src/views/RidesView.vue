<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SeatStepper from '@/components/SeatStepper.vue'
import RouteLine from '@/components/RouteLine.vue'
import { formatDeparture } from '@/utils/format'
import { EUROPEAN_LOCATIONS, getTodayDateString } from '@/utils/locations'
import { useRidesStore } from '@/stores/rides'
import type { RidePayload, Trip } from '@/types'

const rides = useRidesStore()

onMounted(() => {
  rides.fetchMine()
})

const countries = Object.keys(EUROPEAN_LOCATIONS)
const MAX_SEATS = 15

function countryOf(city: string): string {
  return Object.entries(EUROPEAN_LOCATIONS).find(([, cities]) => cities.includes(city))?.[0] ?? ''
}

// ── Form state: 'create', an existing ride's id, or null (closed) ──────────
const formTarget = ref<'create' | string | null>(null)
const formError = ref<string | null>(null)

const form = reactive({
  fromCountry: '',
  fromCity: '',
  toCountry: '',
  toCity: '',
  date: getTodayDateString(),
  time: '09:00',
  seatsTotal: 1,
})

const fromCities = computed<string[]>(() =>
  form.fromCountry ? (EUROPEAN_LOCATIONS[form.fromCountry] ?? []) : [],
)
const toCities = computed<string[]>(() =>
  form.toCountry ? (EUROPEAN_LOCATIONS[form.toCountry] ?? []) : [],
)

watch(
  () => form.fromCountry,
  (next, prev) => {
    if (prev && next !== prev) form.fromCity = ''
  },
)
watch(
  () => form.toCountry,
  (next, prev) => {
    if (prev && next !== prev) form.toCity = ''
  },
)

const editingRide = computed<Trip | null>(() => {
  if (formTarget.value === null || formTarget.value === 'create') return null
  return rides.rides.find((r) => r.id === formTarget.value) ?? null
})

/** Free seats can't drop below what's already booked. */
const minSeats = computed(() =>
  editingRide.value ? Math.max(1, editingRide.value.seatsBooked) : 1,
)

function resetForm() {
  form.fromCountry = ''
  form.fromCity = ''
  form.toCountry = ''
  form.toCity = ''
  form.date = getTodayDateString()
  form.time = '09:00'
  form.seatsTotal = 1
  formError.value = null
}

function openCreate() {
  resetForm()
  formTarget.value = 'create'
}

function openEdit(ride: Trip) {
  resetForm()
  form.fromCountry = countryOf(ride.origin)
  form.fromCity = ride.origin
  form.toCountry = countryOf(ride.destination)
  form.toCity = ride.destination
  form.date = ride.departureAt.slice(0, 10)
  form.time = ride.departureAt.slice(11, 16)
  form.seatsTotal = ride.seatsTotal
  formTarget.value = ride.id
}

function closeForm() {
  formTarget.value = null
  formError.value = null
}

async function submitForm() {
  formError.value = null

  if (
    !form.fromCountry ||
    !form.fromCity ||
    !form.toCountry ||
    !form.toCity ||
    !form.date ||
    !form.time
  ) {
    formError.value = 'All fields are required.'
    return
  }
  if (!Number.isInteger(form.seatsTotal) || form.seatsTotal < minSeats.value) {
    formError.value =
      minSeats.value > 1
        ? `Free seats can't be less than the ${minSeats.value} already booked.`
        : 'Free seats must be at least 1.'
    return
  }
  if (form.seatsTotal > MAX_SEATS) {
    formError.value = `Free seats can't be more than ${MAX_SEATS}.`
    return
  }

  const payload: RidePayload = {
    origin: form.fromCity,
    destination: form.toCity,
    departureAt: `${form.date}T${form.time}:00Z`,
    seatsTotal: form.seatsTotal,
  }

  const ok =
    formTarget.value === 'create'
      ? await rides.create(payload)
      : await rides.update(formTarget.value as string, payload)

  if (ok) {
    closeForm()
  } else {
    formError.value = rides.error
  }
}

// ── Delete ───────────────────────────────────────────────────────────────
const confirmingDeleteId = ref<string | null>(null)

function requestDelete(id: string) {
  confirmingDeleteId.value = id
}

function cancelDelete() {
  confirmingDeleteId.value = null
}

async function confirmDelete(id: string) {
  const ok = await rides.remove(id)
  if (ok) confirmingDeleteId.value = null
}

// ── Display helpers ──────────────────────────────────────────────────────
function seatsLeft(ride: Trip): number {
  return ride.seatsTotal - ride.seatsBooked
}
</script>

<template>
  <section class="rise max-w-2xl">
    <!-- ── Page header ────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="page-title">My rides</h1>
        <p class="page-lead">Rides you're offering as a driver.</p>
      </div>

      <button
        v-if="formTarget === null"
        id="rides-offer-btn"
        type="button"
        class="btn btn-primary shrink-0"
        @click="openCreate"
      >
        Offer a ride
      </button>
    </div>

    <!-- ── FORM: create or edit ──────────────────────────────────────── -->
    <form
      v-if="formTarget !== null"
      id="ride-form"
      class="card mt-8 grid gap-6"
      @submit.prevent="submitForm"
    >
      <h2 class="section-title">
        {{ formTarget === 'create' ? 'Offer a ride' : 'Edit ride' }}
      </h2>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="field">
          <span>From country</span>
          <select id="ride-form-from-country" v-model="form.fromCountry" required>
            <option value="" disabled>Select country</option>
            <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="field">
          <span>Start city</span>
          <select
            id="ride-form-from-city"
            v-model="form.fromCity"
            :disabled="!form.fromCountry"
            required
          >
            <option value="" disabled>
              {{ form.fromCountry ? 'Select city' : 'Pick country first' }}
            </option>
            <option v-for="city in fromCities" :key="city" :value="city">{{ city }}</option>
          </select>
        </label>
        <label class="field">
          <span>To country</span>
          <select id="ride-form-to-country" v-model="form.toCountry" required>
            <option value="" disabled>Select country</option>
            <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="field">
          <span>End city</span>
          <select id="ride-form-to-city" v-model="form.toCity" :disabled="!form.toCountry" required>
            <option value="" disabled>
              {{ form.toCountry ? 'Select city' : 'Pick country first' }}
            </option>
            <option v-for="city in toCities" :key="city" :value="city">{{ city }}</option>
          </select>
        </label>
        <label class="field">
          <span>Date</span>
          <input id="ride-form-date" v-model="form.date" type="date" required />
        </label>
        <label class="field">
          <span>Hour</span>
          <input id="ride-form-time" v-model="form.time" type="time" required />
        </label>
        <div class="field">
          <span>Free seats</span>
          <SeatStepper
            id="ride-form-seats"
            v-model="form.seatsTotal"
            label="Free seats"
            :min="minSeats"
            :max="MAX_SEATS"
          />
        </div>
      </div>

      <p v-if="formError" class="alert alert-error" role="alert">
        {{ formError }}
      </p>

      <div class="flex items-center gap-3">
        <button
          id="ride-form-save-btn"
          type="submit"
          class="btn btn-primary"
          :disabled="rides.pending"
        >
          {{ rides.pending ? 'Saving…' : 'Save ride' }}
        </button>
        <button
          id="ride-form-cancel-btn"
          type="button"
          class="btn btn-ghost"
          :disabled="rides.pending"
          @click="closeForm"
        >
          Cancel
        </button>
      </div>
    </form>

    <!-- ── LIST ───────────────────────────────────────────────────────── -->
    <p v-if="rides.error && formTarget === null" class="alert alert-error mt-8" role="alert">
      {{ rides.error }}
    </p>

    <p v-if="rides.pending && rides.rides.length === 0" class="meta mt-10 text-sm">
      Loading your rides…
    </p>
    <div v-else-if="rides.rides.length === 0" id="rides-empty" class="empty mt-10">
      <p class="meta mt-1.5 text-sm">You're not offering any rides yet.</p>
    </div>
    <ul v-else class="mt-10 grid gap-4">
      <li v-for="ride in rides.rides" :id="`ride-card-${ride.id}`" :key="ride.id" class="card">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <RouteLine :origin="ride.origin" :destination="ride.destination" />
            <p class="meta mt-1">
              Departing {{ formatDeparture(ride.departureAt) }} · {{ seatsLeft(ride) }} of
              {{ ride.seatsTotal }} seats free
            </p>
          </div>

          <div class="flex items-center gap-2">
            <template v-if="confirmingDeleteId !== ride.id">
              <button
                :id="`ride-edit-btn-${ride.id}`"
                type="button"
                class="btn btn-ghost"
                @click="openEdit(ride)"
              >
                Edit
              </button>
              <button
                :id="`ride-delete-btn-${ride.id}`"
                type="button"
                class="btn btn-danger"
                @click="requestDelete(ride.id)"
              >
                Delete
              </button>
            </template>
            <template v-else>
              <span class="text-sm font-medium text-red-600 dark:text-red-400"
                >Delete this ride?</span
              >
              <button
                :id="`ride-delete-confirm-btn-${ride.id}`"
                type="button"
                class="btn btn-danger-solid"
                :disabled="rides.pending"
                @click="confirmDelete(ride.id)"
              >
                Yes, delete
              </button>
              <button
                :id="`ride-delete-cancel-btn-${ride.id}`"
                type="button"
                class="btn btn-ghost"
                :disabled="rides.pending"
                @click="cancelDelete"
              >
                Cancel
              </button>
            </template>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
