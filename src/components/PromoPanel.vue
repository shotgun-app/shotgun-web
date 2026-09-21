<script setup lang="ts">
/**
 * Landing hero: one photograph, the value proposition, nothing else.
 * Copy is static marketing text, not app data.
 */
</script>

<template>
  <section class="relative isolate flex min-h-[42dvh] items-end overflow-hidden lg:min-h-dvh">
    <!--
      Stock photo of highway traffic, free under the Unsplash License.
      Swap the src once real brand photography exists.
    -->
    <img
      src="https://images.unsplash.com/photo-1754373218908-108881f8541f?auto=format&fit=crop&crop=entropy&w=1200&h=1600&q=70"
      alt=""
      width="1200"
      height="1600"
      fetchpriority="high"
      class="absolute inset-0 -z-10 size-full object-cover"
    />
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950 via-brand-950/80 to-brand-950/35"
    ></div>

    <div class="w-full max-w-xl p-8 sm:p-12 lg:p-16">
      <p class="rise text-sm font-medium tracking-tight text-white/70">Shotgun</p>

      <h1
        class="rise mt-6 text-balance text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
        style="animation-delay: 80ms"
      >
        Nobody drives that route
        <span class="text-accent-400">alone</span>.
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
