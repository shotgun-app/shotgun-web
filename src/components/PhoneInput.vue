<script setup lang="ts">
import { ref, watch } from 'vue'
import { DIAL_CODES, joinPhone, splitPhone } from '@/utils/dialCodes'

/** v-model is E.164 ("+38640123456") or '' when empty. */
const model = defineModel<string>({ required: true })
defineProps<{ id?: string }>()

const initial = splitPhone(model.value)
const country = ref(initial.country)
const national = ref(initial.national)

watch([country, national], () => {
  model.value = joinPhone(country.value, national.value)
})

// The parent resets the value when editing starts or is cancelled
watch(model, (value) => {
  if (value === joinPhone(country.value, national.value)) return
  const next = splitPhone(value)
  country.value = next.country
  national.value = next.national
})
</script>

<template>
  <div class="grid grid-cols-[minmax(0,9.5rem)_1fr] gap-2">
    <select v-model="country" class="input px-3" aria-label="Country code">
      <option v-for="c in DIAL_CODES" :key="c.country" :value="c.country">
        {{ c.country }} (+{{ c.dial }})
      </option>
    </select>
    <input
      :id="id"
      v-model="national"
      class="input"
      type="tel"
      inputmode="tel"
      autocomplete="tel-national"
      placeholder="40 123 456"
      aria-label="Phone number"
    />
  </div>
</template>
