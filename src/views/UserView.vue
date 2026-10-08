<script setup lang="ts">
import { watch } from 'vue'
import { useUsersStore } from '@/stores/users'
import UserAvatar from '@/components/UserAvatar.vue'
import ProfileDetails from '@/components/ProfileDetails.vue'

const props = defineProps<{ id: string }>()
const users = useUsersStore()

watch(() => props.id, users.load, { immediate: true })
</script>

<template>
  <section class="rise max-w-2xl">
    <p v-if="users.error" class="alert alert-error" role="alert">
      {{ users.error }}
    </p>

    <p v-else-if="!users.user" class="meta text-sm">Loading profile…</p>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <h1 class="page-title">{{ users.user.user.name }}</h1>

        <UserAvatar :name="users.user.user.name" size="lg" />
      </div>

      <ProfileDetails :user="users.user.user" class="mt-10" />

      <template v-if="users.user.reviews.length > 0">
        <!-- Driver score -->
        <section class="mt-10">
          <h2 class="section-title">Driver Score</h2>

          <div class="mt-3 flex items-center gap-3">
            <span class="text-2xl font-semibold">
              {{ users.user.driverScore.toFixed(1) }}
            </span>

            <span class="text-lg"> ★ </span>
          </div>
        </section>

        <!-- Reviews -->
        <section class="mt-10">
          <h2 class="section-title">Reviews</h2>

          <ul class="mt-4 grid gap-4">
            <li
              v-for="review in users.user.reviews"
              :key="review.id"
              class="card"
            >
              <div class="flex items-center gap-1">
                <span v-for="star in 5" :key="star" class="text-lg">
                  {{ star <= review.rating ? '★' : '☆' }}
                </span>
              </div>

              <p v-if="review.comment" class="mt-3 text-sm">
                {{ review.comment }}
              </p>

              <p class="meta mt-3 text-xs">
                {{ new Date(review.createdAt).toLocaleDateString() }}
              </p>
            </li>
          </ul>
        </section>
      </template>
    </template>
  </section>
</template>