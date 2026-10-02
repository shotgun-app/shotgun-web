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
    <p v-if="users.error" class="alert alert-error" role="alert">{{ users.error }}</p>
    <p v-else-if="!users.user" class="meta text-sm">Loading profile…</p>
    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <h1 class="page-title">{{ users.user.name }}</h1>
        <UserAvatar :name="users.user.name" size="lg" />
      </div>
      <ProfileDetails :user="users.user" class="mt-10" />
    </template>
  </section>
</template>
