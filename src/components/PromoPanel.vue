<script setup lang="ts">
/**
 * Landing hero copy: the value proposition, nothing else. The photograph is in LandingView.
 * Copy is static marketing text, not app data.
 */
</script>

<template>
  <!-- The photo itself lives in LandingView, so on small screens it can sit behind the form too. -->
  <section class="flex items-end lg:min-h-dvh">
    <div class="w-full max-w-xl px-6 pt-14 pb-8 sm:px-12 lg:p-16">
      <h1
        class="rise text-balance text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
        style="animation-delay: 80ms"
      >
        Ride together. Reduce traffic.
        <span class="text-accent-400">Save the planet.</span>
      </h1>

      <p
        class="rise mt-6 max-w-md text-pretty text-base leading-relaxed text-white/75 sm:text-lg"
        style="animation-delay: 160ms"
      >
        Shotgun matches drivers with empty seats to passengers going the same way, at the same time.
      </p>
    </div>
  </section>
</template>
