import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './assets/main.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const app = createApp(App)
const pinia = createPinia()

window.addEventListener('auth:unauthorized', () => {
  const auth = useAuthStore()
  auth.clearSession()
  if (router.currentRoute.value.name !== 'landing') {
    router.push({ name: 'landing', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

app.use(pinia)
app.use(router)

// Before mount, so the first paint already carries the stored theme.
useThemeStore(pinia).init()

app.mount('#app')
