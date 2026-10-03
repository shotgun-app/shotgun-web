<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types'
import { formatPhone } from '@/utils/dialCodes'

const props = defineProps<{ user: User }>()

const memberSince = computed(() =>
  new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(props.user.joinedAt),
  ),
)
</script>

<template>
  <dl class="divide-y divide-line dark:divide-night-line">
    <div class="grid grid-cols-[7rem_1fr] gap-4 py-4">
      <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Name</dt>
      <dd class="text-sm font-medium text-ink dark:text-night-ink">{{ user.name }}</dd>
    </div>
    <div class="grid grid-cols-[7rem_1fr] gap-4 py-4">
      <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Email</dt>
      <dd class="text-sm font-medium text-ink dark:text-night-ink">{{ user.email }}</dd>
    </div>
    <div class="grid grid-cols-[7rem_1fr] gap-4 py-4">
      <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Phone</dt>
      <dd id="profile-phone" class="text-sm font-medium text-ink dark:text-night-ink">
        {{ formatPhone(user.phone) || 'Not added' }}
      </dd>
    </div>
    <div class="grid grid-cols-[7rem_1fr] gap-4 py-4">
      <dt class="text-sm text-ink-soft dark:text-night-ink-soft">Member since</dt>
      <dd class="text-sm font-medium text-ink dark:text-night-ink">{{ memberSince }}</dd>
    </div>
  </dl>
</template>
