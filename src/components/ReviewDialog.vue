<script setup lang="ts">
import { ref } from 'vue'
import { PhStar, PhX } from '@phosphor-icons/vue'

defineProps<{
  title: string
  /** Who is being rated. */
  name: string
  placeholder: string
  submitting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'submit', review: { rating: number; comment: string }): void
  (e: 'close'): void
}>()

const rating = ref(0)
const hovered = ref(0)
const comment = ref('')

const LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent']

function submit() {
  if (rating.value === 0) return
  emit('submit', { rating: rating.value, comment: comment.value.trim() })
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      @keydown.esc="emit('close')"
    >
      <form class="card w-full max-w-md" @submit.prevent="submit">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="review-modal-title" class="section-title">{{ title }}</h2>
            <p class="meta mt-1">{{ name }}</p>
          </div>

          <button
            type="button"
            class="btn btn-ghost size-10.5 shrink-0 p-0"
            aria-label="Close review"
            :disabled="submitting"
            @click="emit('close')"
          >
            <PhX :size="16" aria-hidden="true" />
          </button>
        </div>

        <div class="field mt-6">
          <span>Rating</span>
          <div class="flex items-center gap-3">
            <div class="flex gap-1" role="radiogroup" aria-label="Rating" @mouseleave="hovered = 0">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                role="radio"
                :aria-label="`${star} star${star === 1 ? '' : 's'}`"
                :aria-checked="rating === star"
                class="cursor-pointer rounded-card p-1 text-slate-300 transition-colors duration-200 disabled:cursor-not-allowed dark:text-slate-600"
                :class="{ '!text-brand-600 dark:!text-brand-400': star <= (hovered || rating) }"
                :disabled="submitting"
                @mouseenter="hovered = star"
                @click="rating = star"
              >
                <PhStar :size="32" :weight="star <= (hovered || rating) ? 'fill' : 'regular'" />
              </button>
            </div>
            <span class="meta" aria-live="polite">{{ LABELS[(hovered || rating) - 1] ?? '' }}</span>
          </div>
        </div>

        <label class="field mt-5">
          <span>Review <span class="font-normal">(optional)</span></span>
          <textarea
            v-model="comment"
            rows="4"
            maxlength="500"
            :placeholder="placeholder"
            :disabled="submitting"
          ></textarea>
          <span class="meta justify-self-end font-normal">{{ comment.length }} / 500</span>
        </label>

        <p v-if="error" class="alert alert-error mt-4" role="alert">{{ error }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="btn btn-ghost" :disabled="submitting" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="rating === 0 || submitting">
            {{ submitting ? 'Submitting…' : 'Submit review' }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
