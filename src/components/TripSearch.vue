<script setup lang="ts">
/**
 * TripSearch.vue
 *
 * Demonstrates:
 * 1. ref(): Stores reactive primitive values (selected countries, cities, date, time).
 * 2. computed(): Dynamically derives the list of available cities based on the selected country.
 * 3. watch(): Automatically resets the selected city whenever its parent country changes.
 * 4. v-model: Two-way data binding connecting HTML <select> and <input> to Vue state.
 * 5. @submit.prevent: Event handling that intercepts HTML form submission.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { PhArrowsLeftRight } from '@phosphor-icons/vue'
import { EUROPEAN_LOCATIONS, getTodayDateString } from '@/utils/locations'
import { useTripsStore } from '@/stores/trips'

const trips = useTripsStore()

// Extract all country names (e.g. ['Sweden', 'Germany', 'France', ...])
const countries = Object.keys(EUROPEAN_LOCATIONS)

// --- REACTIVE STATE: "FROM" (Origin) ---
const fromCountry = ref<string>('')
const fromCity = ref<string>('')

// Computed: Automatically recalculates the list of cities when `fromCountry` changes
const fromCities = computed<string[]>(() => {
  return fromCountry.value ? (EUROPEAN_LOCATIONS[fromCountry.value] ?? []) : []
})

// Flag: Prevent watchers from clearing when swapping origin and destination (countries + cities)
const isSwapping = ref(false)

// Watch: When the user switches origin country, reset the city so they don't keep an invalid city
watch(fromCountry, (next, prev) => {
  if (!isSwapping.value && prev && next !== prev) {
    fromCity.value = ''
  }
})

// --- REACTIVE STATE: "TO" (Destination) ---
const toCountry = ref<string>('')
const toCity = ref<string>('')

const toCities = computed<string[]>(() => {
  return toCountry.value ? (EUROPEAN_LOCATIONS[toCountry.value] ?? []) : []
})

watch(toCountry, (next, prev) => {
  if (!isSwapping.value && prev && next !== prev) {
    toCity.value = ''
  }
})

/** Swap origin and destination (countries + cities) in one click. */
function swapLocations() {
  isSwapping.value = true
  // Swap countries
  const prevFromCountry = fromCountry.value
  fromCountry.value = toCountry.value
  toCountry.value = prevFromCountry

  // Swap cities
  const prevFromCity = fromCity.value
  fromCity.value = toCity.value
  toCity.value = prevFromCity

  // Reset on the next tick, after watchers have flushed
  nextTick(() => {
    isSwapping.value = false
  })
}

// --- DATE & TIME (Dynamically defaults to today) ---
const departureDate = ref<string>(getTodayDateString())
const departureTime = ref<string>('')

// --- SUBMISSION ---
async function handleSearch() {
  if (!fromCity.value || !toCity.value) return

  await trips.search({
    originCity: fromCity.value,
    destinationCity: toCity.value,
    departureDate: departureDate.value || undefined,
    departureTime: departureTime.value || undefined,
  })
}
</script>

<template>
  <div class="card">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="section-title">Find a ride</h2>
        <p class="page-lead mt-1">Select origin, destination, and travel date across Europe.</p>
      </div>
    </div>

    <!-- SEARCH FORM -->
    <form class="grid gap-6" @submit.prevent="handleSearch">
      <!-- ROUTE: From, swap, To — one visual group -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <!-- From -->
        <div class="grid grid-cols-2 gap-3">
          <label class="field">
            <span>From country</span>
            <select v-model="fromCountry" required>
              <option value="" disabled>Select country</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="field">
            <span>From city</span>
            <select v-model="fromCity" :disabled="!fromCountry" required>
              <option value="" disabled>
                {{ fromCountry ? 'Select city' : 'Pick country first' }}
              </option>
              <option v-for="city in fromCities" :key="city" :value="city">{{ city }}</option>
            </select>
          </label>
        </div>

        <!-- Swap button, centered between From and To -->
        <div class="flex justify-center sm:pt-6">
          <button
            type="button"
            class="btn btn-ghost size-9 rounded-full p-0"
            aria-label="Swap origin and destination"
            title="Swap origin and destination"
            @click="swapLocations"
          >
            <PhArrowsLeftRight :size="16" class="rotate-90 sm:rotate-0" aria-hidden="true" />
          </button>
        </div>

        <!-- To -->
        <div class="grid grid-cols-2 gap-3">
          <label class="field">
            <span>To country</span>
            <select v-model="toCountry" required>
              <option value="" disabled>Select country</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="field">
            <span>To city</span>
            <select v-model="toCity" :disabled="!toCountry" required>
              <option value="" disabled>
                {{ toCountry ? 'Select city' : 'Pick country first' }}
              </option>
              <option v-for="city in toCities" :key="city" :value="city">{{ city }}</option>
            </select>
          </label>
        </div>
      </div>

      <!-- WHEN + ACTION -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label class="field">
          <span>Departure date</span>
          <input v-model="departureDate" type="date" required />
        </label>

        <label class="field">
          <span>Preferred time (optional)</span>
          <input v-model="departureTime" type="time" />
        </label>

        <button
          type="submit"
          class="btn btn-primary h-10.5 w-full sm:w-auto"
          :disabled="trips.pending || !fromCity || !toCity"
        >
          <span v-if="trips.pending">Searching…</span>
          <span v-else>Find drivers</span>
        </button>
      </div>
    </form>
  </div>
</template>
