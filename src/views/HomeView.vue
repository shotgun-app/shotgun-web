<script setup lang="ts">
/**
 * HomeView.vue
 *
 * Demonstrates:
 * 1. Store consumption: Reads reactive state from both `useAuthStore` and `useTripsStore`.
 * 2. Component composition: Uses `<TripSearch>` for the query form and `<TripCard>` for each result.
 * 3. Conditional rendering: `v-if`, `v-else-if`, `v-else` to toggle between loading, empty state, and results.
 * 4. List rendering: `v-for="trip in trips.results" :key="trip.id"` to display rows of drivers.
 */
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTripsStore } from '@/stores/trips'
import TripSearch from '@/components/TripSearch.vue'
import TripCard from '@/components/TripCard.vue'
import { greetingFor } from '@/utils/greeting'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const trips = useTripsStore()
const router = useRouter()

/** One of three greetings, picked from the user's local time when the page opens. */
const greeting = computed(() => greetingFor(new Date()))

function onReserve() {
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

onMounted(async () => {
  if (!trips.hasSearched) {
    await trips.search({ originCity: '', destinationCity: '' })
  }
})
</script>

<template>
  <div class="space-y-10">
    <!-- PAGE HEADER -->
    <header class="rise">
      <h1 class="page-title">{{ greeting }}, {{ auth.user?.name ?? 'there' }}</h1>
      <p class="page-lead">
        Where are you heading? Search carpool rides and connect with verified drivers across Europe.
      </p>
    </header>

    <!-- SEARCH FORM COMPONENT -->
    <section class="rise" style="animation-delay: 80ms">
      <TripSearch />
    </section>

    <!-- SEARCH RESULTS SECTION -->
    <section class="rise space-y-4" style="animation-delay: 160ms">
      <!-- Error Message -->
      <div v-if="trips.error" class="alert alert-error" role="alert">
        {{ trips.error }}
      </div>

      <!-- 1. Loading Indicator -->
      <div
        v-if="trips.pending"
        class="card flex flex-col items-center justify-center py-16 text-center"
      >
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent dark:border-brand-400"
        ></div>
        <p class="mt-4 text-sm font-medium text-ink dark:text-night-ink">
          Finding available drivers...
        </p>
        <p class="meta">Checking verified routes across Europe</p>
      </div>

      <!-- 2. Results List (When Search Returned Matches) -->
      <div v-else-if="trips.hasSearched && trips.results.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="section-title">Available drivers ({{ trips.results.length }})</h2>
          <span class="meta"> Prices include tolls and fuel share </span>
        </div>

        <!-- Vertical column with rows of drivers/trips -->
        <div class="grid grid-cols-1 gap-4">
          <TripCard
            v-for="trip in trips.results"
            :key="trip.id"
            :trip="trip"
            @reserve="onReserve"
          />
        </div>
      </div>

      <!-- 3. Empty State (When Search Returned Zero Matches) -->
      <div v-else-if="trips.hasSearched && trips.results.length === 0" class="empty">
        <p class="text-sm font-medium text-ink dark:text-night-ink">No drivers found</p>
        <p class="meta mx-auto mt-1.5 max-w-sm text-sm">
          We couldn't find any trips for this route and date. Try selecting a different date or
          route (e.g., Gothenburg → Stockholm or Berlin → Munich).
        </p>
      </div>

      <!-- 4. Initial Placeholder (Before User Searches) -->
      <div v-else class="empty">
        <p class="text-sm font-medium text-ink dark:text-night-ink">Ready to travel?</p>
        <p class="meta mx-auto mt-1.5 max-w-md text-sm">
          Select your departure and arrival countries and cities above to see matching drivers and
          available seats.
        </p>
      </div>
    </section>
  </div>
</template>
