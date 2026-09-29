<script setup lang="ts">
import { computed } from 'vue'
import { PhMinus, PhPlus } from '@phosphor-icons/vue'

const props = defineProps<{
  id?: string
  label: string
  min?: number
  max?: number
}>()

const model = defineModel<number>({ required: true })

const low = computed(() => props.min ?? 1)
const canDecrease = computed(() => model.value > low.value)
const canIncrease = computed(() => props.max === undefined || model.value < props.max)

function step(by: number) {
  const next = (Number.isFinite(model.value) ? model.value : low.value) + by
  model.value = Math.min(props.max ?? Infinity, Math.max(low.value, next))
}
</script>

<template>
  <div class="flex items-stretch gap-2">
    <button
      type="button"
      class="btn btn-ghost size-10.5 shrink-0 p-0"
      :aria-label="`Fewer: ${label}`"
      :disabled="!canDecrease"
      @click="step(-1)"
    >
      <PhMinus :size="16" aria-hidden="true" />
    </button>
    <input
      :id="id"
      v-model.number="model"
      type="number"
      inputmode="numeric"
      class="input w-16 min-w-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      :aria-label="label"
      :min="min ?? 1"
      :max="max"
      required
    />
    <button
      type="button"
      class="btn btn-ghost size-10.5 shrink-0 p-0"
      :aria-label="`More: ${label}`"
      :disabled="!canIncrease"
      @click="step(1)"
    >
      <PhPlus :size="16" aria-hidden="true" />
    </button>
  </div>
</template>
