<script setup lang="ts">
import { computed } from 'vue'
import { initialsOf } from '@/utils/format'

const props = withDefaults(
  defineProps<{ name: string | null | undefined; size?: 'sm' | 'md' | 'lg' }>(),
  {
    size: 'md',
  },
)

const initials = computed(() => initialsOf(props.name))
const sizes = { sm: 'size-7 text-[0.6875rem]', md: 'size-11 text-sm', lg: 'size-14 text-xl' }
</script>

<template>
  <span
    class="grid shrink-0 place-items-center rounded-full bg-brand-600 font-medium text-white"
    :class="sizes[size]"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>
