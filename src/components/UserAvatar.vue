<script setup lang="ts">
import { computed } from 'vue'
import { initialsOf } from '@/utils/format'
import { apiUrl } from '@/utils/apiUrl'

const props = withDefaults(
  defineProps<{
    name: string | null | undefined
    /** The user's `avatarUrl`. Without one the initials are shown. */
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    src: null,
    size: 'md',
  },
)

const initials = computed(() => initialsOf(props.name))
const sizes = { sm: 'size-7 text-[0.6875rem]', md: 'size-11 text-sm', lg: 'size-14 text-xl' }
</script>

<template>
  <img
    v-if="src"
    :src="apiUrl(src)"
    alt=""
    class="shrink-0 rounded-full object-cover"
    :class="sizes[size]"
    aria-hidden="true"
  />
  <span
    v-else
    class="grid shrink-0 place-items-center rounded-full bg-brand-600 font-medium text-white"
    :class="sizes[size]"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>
