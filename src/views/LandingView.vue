<script setup lang="ts">
import PromoPanel from '@/components/PromoPanel.vue'
import AuthPanel from '@/components/AuthPanel.vue'
import ResetPasswordPanel from '@/components/ResetPasswordPanel.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

withDefaults(defineProps<{ panel?: 'auth' | 'reset' }>(), { panel: 'auth' })
</script>

<template>
  <!--
    Below `lg` the photo is a full-screen background, the headline sits on it and the form
    is a card on top. From `lg` up it is a half / half split: photo left, form right, with
    a real border as the divider.
  -->
  <main class="relative isolate grid min-h-dvh grid-cols-1 lg:grid-cols-2">
    <!--
      Stock photo of highway traffic, free under the Unsplash License.
      Swap the src once real brand photography exists.
    -->
    <div class="absolute inset-0 -z-10 lg:w-1/2">
      <img
        src="https://images.unsplash.com/photo-1754373218908-108881f8541f?auto=format&fit=crop&crop=entropy&w=1200&h=1600&q=70"
        alt=""
        width="1200"
        height="1600"
        fetchpriority="high"
        class="size-full object-cover"
      />
      <div class="absolute inset-0 bg-brand-950/75 lg:hidden"></div>
      <div
        class="absolute inset-0 hidden bg-linear-to-t from-brand-950 via-brand-950/80 to-brand-950/35 lg:block"
      ></div>
    </div>

    <PromoPanel />

    <section
      class="relative mx-4 mb-8 flex items-center justify-center rounded-card bg-white px-6 py-12 sm:mx-10 sm:px-10 lg:mx-0 lg:mb-0 lg:rounded-none lg:border-l lg:border-line lg:px-16 lg:py-16 dark:bg-night dark:lg:border-night-line"
    >
      <ThemeToggle class="absolute top-5 right-5 sm:top-6 sm:right-6" />
      <ResetPasswordPanel v-if="panel === 'reset'" />
      <AuthPanel v-else />
    </section>
  </main>
</template>
