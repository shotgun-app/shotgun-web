<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from '@/components/ThemeToggle.vue'

const auth = useAuthStore()
const router = useRouter()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const initials = computed(() =>
  (auth.user?.name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)

function close() {
  open.value = false
}

function onPointerDown(event: MouseEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})

async function logout() {
  close()
  await auth.logout()
  await router.push({ name: 'landing' })
}
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-md dark:border-night-line dark:bg-night/80"
  >
    <div class="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
      <RouterLink :to="{ name: 'app' }" class="text-sm font-medium tracking-tight">
        Shotgun
      </RouterLink>

      <div class="flex items-center gap-3">
        <ThemeToggle />

        <div ref="root" class="relative">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-2.5 rounded-full border border-line py-1 pr-3 pl-1 transition-colors duration-200 hover:border-slate-300 dark:border-night-line dark:hover:border-slate-600"
            :aria-expanded="open"
            aria-haspopup="menu"
            @click="open = !open"
          >
            <span
              class="grid size-7 place-items-center rounded-full bg-brand-600 text-[0.6875rem] font-medium text-white"
            >
              {{ initials }}
            </span>
            <span class="hidden text-sm sm:inline">{{ auth.user?.name }}</span>
          </button>

          <ul
            v-if="open"
            class="absolute top-[calc(100%+0.5rem)] right-0 w-48 rounded-card border border-line bg-white p-1.5 shadow-lg shadow-slate-900/5 dark:border-night-line dark:bg-night-raised dark:shadow-black/40"
            role="menu"
          >
            <li role="none">
              <RouterLink
                role="menuitem"
                :to="{ name: 'profile' }"
                class="block rounded-[0.5rem] px-3 py-2 text-sm transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-brand-950"
                @click="close"
              >
                My profile
              </RouterLink>
            </li>
            <li role="none">
              <RouterLink
                role="menuitem"
                :to="{ name: 'rides' }"
                class="block rounded-[0.5rem] px-3 py-2 text-sm transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-brand-950"
                @click="close"
              >
                My rides
              </RouterLink>
            </li>
            <li role="none" class="my-1 h-px bg-line dark:bg-night-line"></li>
            <li role="none">
              <button
                role="menuitem"
                type="button"
                class="block w-full cursor-pointer rounded-[0.5rem] px-3 py-2 text-left text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                @click="logout"
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </header>
</template>
