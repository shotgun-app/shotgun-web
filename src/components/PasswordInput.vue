<script setup lang="ts">
import { ref } from 'vue'
import { PhEye, PhEyeSlash } from '@phosphor-icons/vue'

defineProps<{
  autocomplete?: string
  placeholder?: string
  minlength?: number
  required?: boolean
  id?: string
}>()

const model = defineModel<string>({ required: true })
const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :minlength="minlength"
      :required="required"
      class="input w-full pr-11"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-card text-ink-soft transition-colors duration-200 hover:text-ink dark:text-night-ink-soft dark:hover:text-night-ink"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <component :is="visible ? PhEyeSlash : PhEye" :size="18" aria-hidden="true" />
    </button>
  </div>
</template>
