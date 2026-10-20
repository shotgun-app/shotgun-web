<script setup lang="ts">
/**
 * SustainabilityImpactView.vue
 *
 * Public page (accessible without login) detailing the platform-wide
 * environmental impact, emissions reductions, and carpooling metrics.
 */
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhLeaf,
  PhCar,
  PhUsers,
  PhGasPump,
  PhArrowClockwise,
  PhShieldCheck,
  PhGlobe,
} from '@phosphor-icons/vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { useImpactStore } from '@/stores/impact'
import { formatCo2 } from '@/utils/format'

const auth = useAuthStore()
const impactStore = useImpactStore()

onMounted(async () => {
  await impactStore.fetch()
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 transition-colors duration-200 dark:bg-night">
    <!-- TOP NAVIGATION -->
    <header
      class="border-b border-line bg-white/80 backdrop-blur-md dark:border-night-line dark:bg-night-raised/80"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <!-- The logo is the only way back, so it leads signed-in users to the app -->
        <RouterLink
          :to="auth.isAuthenticated ? '/app' : '/'"
          class="flex items-center gap-2.5 font-medium tracking-tight"
        >
          <img src="/logo.png" alt="Shotgun" class="size-7" width="28" height="28" />
          <span class="text-lg text-ink dark:text-night-ink">Shotgun</span>
        </RouterLink>

        <div class="flex items-center gap-3">
          <RouterLink v-if="!auth.isAuthenticated" to="/" class="btn btn-ghost text-xs sm:text-sm">
            Log in / Sign up
          </RouterLink>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- MAIN CONTENT -->
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <!-- HERO SECTION -->
      <section class="rise text-center">
        <div
          class="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700 dark:bg-accent-700/20 dark:text-accent-400"
        >
          <PhLeaf class="size-3.5" />
          <span>Real-Time Environmental Analytics</span>
        </div>

        <h1 class="page-title mt-4 text-3xl sm:text-4xl lg:text-5xl">Sustainability Impact</h1>
        <p
          class="page-lead mx-auto mt-3 max-w-2xl text-base text-ink-soft dark:text-night-ink-soft"
        >
          Transparent, live calculation of greenhouse gas emissions saved across Europe by drivers
          and passengers sharing rides on Shotgun.
        </p>
      </section>

      <!-- ERROR STATE -->
      <div v-if="impactStore.error" class="rise mt-8" style="animation-delay: 80ms">
        <div class="alert alert-error flex items-center justify-between" role="alert">
          <span>{{ impactStore.error }}</span>
          <button
            type="button"
            class="btn btn-ghost inline-flex items-center gap-1.5 py-1 text-xs"
            @click="impactStore.fetch()"
          >
            <PhArrowClockwise class="size-3.5" />
            Retry
          </button>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div
        v-if="impactStore.pending && !impactStore.impact"
        class="card rise mt-10 flex flex-col items-center justify-center py-20 text-center"
      >
        <div
          class="size-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent dark:border-brand-400"
        ></div>
        <p class="mt-4 text-sm font-medium text-ink dark:text-night-ink">
          Calculating live sustainability statistics...
        </p>
        <p class="meta mt-1">Aggregating distance, vehicle emissions, and completed rides</p>
      </div>

      <!-- METRICS CONTENT -->
      <template v-else-if="impactStore.impact">
        <!-- 3 PRIMARY HIGHLIGHTS -->
        <section class="rise mt-10" style="animation-delay: 100ms">
          <div class="mb-4 flex items-center justify-between">
            <h2
              class="text-sm font-semibold tracking-wider text-ink-soft uppercase dark:text-night-ink-soft"
            >
              Carbon Emissions Highlights
            </h2>
            <span class="meta">Baseline: 120 g CO₂ / km per car</span>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
            <!-- 1. CO2 Consumed -->
            <div
              class="card relative flex flex-col justify-between overflow-hidden border-line p-6 dark:border-night-line"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span
                    class="text-xs font-medium text-ink-soft uppercase dark:text-night-ink-soft"
                  >
                    CO₂ Consumed
                  </span>
                  <div
                    class="flex size-9 items-center justify-center rounded-card bg-slate-100 text-ink-soft dark:bg-night dark:text-night-ink-soft"
                  >
                    <PhGasPump class="size-5" />
                  </div>
                </div>
                <p
                  class="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-night-ink"
                >
                  {{ formatCo2(impactStore.co2ConsumedKg) }}
                </p>
              </div>
              <p class="meta mt-4 border-t border-line pt-3 dark:border-night-line">
                Actual CO₂ emissions produced by all completed rides on the Shotgun network.
              </p>
            </div>

            <!-- 2. CO2 That Would Have Been Consumed -->
            <div
              class="card relative flex flex-col justify-between overflow-hidden border-line p-6 dark:border-night-line"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span
                    class="text-xs font-medium text-ink-soft uppercase dark:text-night-ink-soft"
                  >
                    Without Shotgun
                  </span>
                  <div
                    class="flex size-9 items-center justify-center rounded-card bg-slate-100 text-ink-soft dark:bg-night dark:text-night-ink-soft"
                  >
                    <PhCar class="size-5" />
                  </div>
                </div>
                <p
                  class="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-night-ink"
                >
                  {{ formatCo2(impactStore.co2WouldHaveBeenConsumedKg) }}
                </p>
              </div>
              <p class="meta mt-4 border-t border-line pt-3 dark:border-night-line">
                Emissions that would have been generated if every traveler had driven alone in their
                own vehicle.
              </p>
            </div>

            <!-- 3. CO2 Saved (Hero Card) -->
            <div
              class="card relative flex flex-col justify-between overflow-hidden border-2 border-accent-500 bg-accent-100/30 p-6 dark:border-accent-500/80 dark:bg-accent-700/10"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span
                    class="text-xs font-semibold text-accent-700 uppercase dark:text-accent-400"
                  >
                    Total CO₂ Saved
                  </span>
                  <div
                    class="flex size-9 items-center justify-center rounded-card bg-accent-500 text-white"
                  >
                    <PhLeaf class="size-5" />
                  </div>
                </div>
                <p
                  class="mt-4 text-3xl font-bold tracking-tight text-accent-700 sm:text-4xl dark:text-accent-400"
                >
                  {{ formatCo2(impactStore.co2SavedKg) }}
                </p>
              </div>
              <div class="mt-4 border-t border-accent-200/60 pt-3 dark:border-accent-700/30">
                <span class="badge badge-success">
                  {{ impactStore.percentSaved }}% emissions avoided
                </span>
                <p class="meta mt-1.5 text-ink-soft dark:text-night-ink-soft">
                  Net greenhouse gases prevented from entering the atmosphere through shared travel.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- RIDE SHARING & TRAFFIC IMPACT METRICS -->
        <section class="rise mt-10" style="animation-delay: 180ms">
          <div class="mb-4">
            <h2
              class="text-sm font-semibold tracking-wider text-ink-soft uppercase dark:text-night-ink-soft"
            >
              Community & Traffic Impact
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Completed Rides -->
            <div class="card p-5">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-card bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400"
                >
                  <PhCar class="size-5" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-ink dark:text-night-ink">
                    {{ impactStore.totalCompletedRides }}
                  </p>
                  <p class="text-xs font-medium text-ink-soft dark:text-night-ink-soft">
                    Completed Rides
                  </p>
                </div>
              </div>
              <p class="meta mt-3 border-t border-line pt-2.5 dark:border-night-line">
                {{ impactStore.totalSharedRides }} shared trips with passengers.
              </p>
            </div>

            <!-- Passengers Shared -->
            <div class="card p-5">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-card bg-accent-100 text-accent-700 dark:bg-accent-700/20 dark:text-accent-400"
                >
                  <PhUsers class="size-5" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-ink dark:text-night-ink">
                    {{ impactStore.totalPassengers }}
                  </p>
                  <p class="text-xs font-medium text-ink-soft dark:text-night-ink-soft">
                    Passengers Shared
                  </p>
                </div>
              </div>
              <p class="meta mt-3 border-t border-line pt-2.5 dark:border-night-line">
                Travelers who opted for a shared seat.
              </p>
            </div>

            <!-- Individual Rides Saved -->
            <div class="card p-5">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-card bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                >
                  <PhShieldCheck class="size-5" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-ink dark:text-night-ink">
                    {{ impactStore.individualRidesSaved }}
                  </p>
                  <p class="text-xs font-medium text-ink-soft dark:text-night-ink-soft">
                    Individual Rides Saved
                  </p>
                </div>
              </div>
              <p class="meta mt-3 border-t border-line pt-2.5 dark:border-night-line">
                Single-occupancy journeys avoided.
              </p>
            </div>

            <!-- Drivers Off The Street -->
            <div class="card p-5">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-card bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                >
                  <PhGlobe class="size-5" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-ink dark:text-night-ink">
                    {{ impactStore.driversWithoutShotgun }}
                  </p>
                  <p class="text-xs font-medium text-ink-soft dark:text-night-ink-soft">
                    Drivers Without Shotgun
                  </p>
                </div>
              </div>
              <p class="meta mt-3 border-t border-line pt-2.5 dark:border-night-line">
                Vehicles that would have been on the street.
              </p>
            </div>
          </div>
        </section>

        <!-- VISUAL COMPARISON CONTAINER -->
        <section class="rise mt-10" style="animation-delay: 240ms">
          <div class="card border-line p-6 dark:border-night-line">
            <h2 class="section-title">The Power of Shared Mobility</h2>
            <p class="page-lead mt-1">
              Comparing collective footprint on Shotgun versus individual vehicle ownership:
            </p>

            <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <!-- Without Shotgun -->
              <div
                class="rounded-card border border-line bg-slate-50 p-5 dark:border-night-line dark:bg-night"
              >
                <div class="flex items-center justify-between">
                  <h3 class="font-medium text-ink dark:text-night-ink">Without Shotgun</h3>
                  <span class="badge badge-neutral">Independent Travel</span>
                </div>
                <div class="mt-4 space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-soft dark:text-night-ink-soft">Cars on the Road</span>
                    <span class="font-semibold text-ink dark:text-night-ink"
                      >{{ impactStore.driversWithoutShotgun }} vehicles</span
                    >
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-soft dark:text-night-ink-soft">CO₂ Emitted</span>
                    <span class="font-semibold text-ink dark:text-night-ink">{{
                      formatCo2(impactStore.co2WouldHaveBeenConsumedKg)
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-soft dark:text-night-ink-soft">Vehicle Occupancy</span>
                    <span class="font-semibold text-ink dark:text-night-ink">1 person / car</span>
                  </div>
                </div>
              </div>

              <!-- With Shotgun -->
              <div
                class="rounded-card border border-accent-400 bg-accent-100/20 p-5 dark:border-accent-600/50 dark:bg-accent-700/10"
              >
                <div class="flex items-center justify-between">
                  <h3 class="font-medium text-accent-700 dark:text-accent-400">With Shotgun</h3>
                  <span class="badge badge-success">Carpooling Network</span>
                </div>
                <div class="mt-4 space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-soft dark:text-night-ink-soft">Cars on the Road</span>
                    <span class="font-semibold text-accent-700 dark:text-accent-400">
                      {{ impactStore.totalCompletedRides }} vehicles ({{
                        impactStore.individualRidesSaved
                      }}
                      eliminated)
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-soft dark:text-night-ink-soft">CO₂ Emitted</span>
                    <span class="font-semibold text-accent-700 dark:text-accent-400">{{
                      formatCo2(impactStore.co2ConsumedKg)
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-soft dark:text-night-ink-soft"
                      >Total Distance Covered</span
                    >
                    <span class="font-semibold text-accent-700 dark:text-accent-400"
                      >{{ impactStore.totalDistanceKm.toLocaleString() }} km</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CALL TO ACTION -->
        <section class="rise mt-10 text-center" style="animation-delay: 360ms">
          <div class="card flex flex-col items-center justify-between gap-4 p-8 sm:flex-row">
            <div class="text-left">
              <h3 class="text-lg font-medium text-ink dark:text-night-ink">
                Ready to travel more sustainably?
              </h3>
              <p class="text-sm text-ink-soft dark:text-night-ink-soft">
                Publish a trip or book your next seat to cut carbon and travel together.
              </p>
            </div>
            <RouterLink :to="auth.isAuthenticated ? '/app' : '/'" class="btn btn-primary">
              {{ auth.isAuthenticated ? 'Go to Trips' : 'Join Shotgun Today' }}
            </RouterLink>
          </div>
        </section>

        <!-- METHODOLOGY NOTES -->
        <section
          class="rise mt-12 text-xs leading-relaxed text-ink-soft dark:text-night-ink-soft"
          style="animation-delay: 420ms"
        >
          <h3 class="font-medium">Methodology & Baseline Assumptions</h3>
          <ul class="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong class="font-medium">Completed rides:</strong> Derived dynamically from rides
              whose departure time has passed.
            </li>
            <li>
              <strong class="font-medium">CO₂ calculation:</strong> Computed using verified European
              driving distances between cities and specific vehicle emissions registered in the
              Shotgun catalogue (fully electric vehicles emit 0 g/km direct CO₂).
            </li>
            <li>
              <strong class="font-medium">Single-occupancy baseline:</strong> Assumes each passenger
              and driver would otherwise have driven their own average car with 120 g CO₂/km
              (standard European passenger vehicle baseline).
            </li>
            <li>
              <strong class="font-medium">Individual rides saved:</strong> Represents the count of
              passengers who shared a car rather than driving solo.
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>
