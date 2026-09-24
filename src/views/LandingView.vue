<script setup lang="ts">
import PromoPanel from '@/components/PromoPanel.vue'
import AuthPanel from '@/components/AuthPanel.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

<template>
  <!--
    Half / half split screen. The divider is a real border on the auth column:
    vertical from `lg` up, horizontal once the layout stacks.
  -->
  <main class="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
    <PromoPanel />

    <section
      class="relative flex items-center justify-center border-t border-line bg-white px-6 py-16 sm:px-10 lg:border-t-0 lg:border-l lg:px-16 dark:border-night-line dark:bg-night"
    >
      <ThemeToggle class="absolute top-5 right-5 sm:top-6 sm:right-6" />
      <AuthPanel />
    </section>
  </main>
</template>
