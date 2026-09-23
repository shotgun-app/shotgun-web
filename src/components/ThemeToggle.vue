<script setup lang="ts">
/**
 * Sun / Moon in one button. The icon shows where the click takes you: moon
 * while the page is light, sun while it is dark. The words only live in the
 * accessible name, so screen readers keep both states.
 */
import { computed } from 'vue'
import { PhMoon, PhSun } from '@phosphor-icons/vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()

const isDark = computed(() => theme.resolved === 'dark')
const current = computed(() => (isDark.value ? 'Dark' : 'Light'))
const target = computed(() => (isDark.value ? 'Light' : 'Dark'))
</script>

<template>
  <button
    type="button"
    class="btn btn-ghost size-9 p-0"
    :aria-label="`Theme: ${current}. Switch to ${target}.`"
    :title="`Switch to ${target}`"
    @click="theme.toggle()"
  >
    <PhMoon v-if="!isDark" :size="18" aria-hidden="true" />
    <PhSun v-else :size="18" aria-hidden="true" />
  </button>
</template>
