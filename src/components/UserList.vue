<script setup lang="ts">
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/UserAvatar.vue'
import type { PublicUser } from '@/types'

defineProps<{ users: PublicUser[]; empty?: string }>()
</script>

<template>
  <ul v-if="users.length" class="flex items-center gap-2 overflow-x-auto text-sm whitespace-nowrap">
    <li v-for="(user, i) in users" :key="user.id" class="flex items-center">
      <RouterLink
        :to="{ name: 'user', params: { id: user.id } }"
        target="_blank"
        class="flex items-center gap-1.5 font-medium text-ink hover:text-brand-600 hover:underline dark:text-night-ink dark:hover:text-brand-400"
      >
        <UserAvatar :name="user.name" size="sm" />
        {{ user.name }}
      </RouterLink>
      <template v-if="i < users.length - 1">,</template>
    </li>
  </ul>
  <p v-else-if="empty" class="meta">{{ empty }}</p>
</template>
