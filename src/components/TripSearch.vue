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
import { EUROPEAN_LOCATIONS, getTodayDateString } from '@/mock/data'
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

/** Convenience demo helper: prefill a route that has matching mock drivers */
async function fillDemoRoute(route: 'sweden' | 'germany') {
  if (route === 'sweden') {
    fromCountry.value = 'Sweden'
    toCountry.value = 'Sweden'
    await nextTick()
    fromCity.value = 'Gothenburg'
    toCity.value = 'Stockholm'
    //departureDate.value = '2026-09-25'
    departureDate.value = getTodayDateString()
  } else {
    fromCountry.value = 'Germany'
    toCountry.value = 'Germany'
    await nextTick()
    fromCity.value = 'Berlin'
    toCity.value = 'Munich'
    //departureDate.value = '2026-09-25'
    departureDate.value = getTodayDateString()
  }
}
</script>

<template>
  <div
    class="rounded-card border border-line bg-white p-6 shadow-xs dark:border-night-line dark:bg-night-raised"
  >
    <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-medium tracking-tight text-ink dark:text-night-ink">Find a ride</h2>
        <p class="mt-1 text-sm text-ink-soft dark:text-night-ink-soft">
          Select origin, destination, and travel date across Europe.
        </p>
      </div>

      <!-- Quick demo autofill buttons -->
      <div class="flex items-center gap-2 text-xs">
        <span class="text-ink-soft dark:text-night-ink-soft">Try demo:</span>
        <button
          type="button"
          class="cursor-pointer rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-slate-50 dark:border-night-line dark:text-night-ink dark:hover:bg-night"
          @click="fillDemoRoute('sweden')"
        >
          Gothenburg → Stockholm
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-slate-50 dark:border-night-line dark:text-night-ink dark:hover:bg-night"
          @click="fillDemoRoute('germany')"
        >
          Berlin → Munich
        </button>
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
            class="cursor-pointer rounded-full border border-line p-2 text-ink hover:bg-slate-50 dark:border-night-line dark:text-night-ink dark:hover:bg-night"
            @click="swapLocations"
            aria-label="Swap origin and destination"
            title="Swap origin and destination"
          >
            <!-- Simple left/right arrows icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 rotate-90"
            >
              <path d="M7 16V4" />
              <path d="m3 8 4-4 4 4" />
              <path d="M17 8v12" />
              <path d="m21 16-4 4-4-4" />
            </svg>
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
          class="btn btn-primary h-[42px] w-full sm:w-auto"
          :disabled="trips.pending || !fromCity || !toCity"
        >
          <span v-if="trips.pending">Searching...</span>
          <span v-else>Find Drivers</span>
        </button>
      </div>
    </form>
  </div>
</template>
