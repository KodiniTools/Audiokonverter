import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Nutze gleichen Key wie die globale SSI-Navigation
  const savedTheme = localStorage.getItem('theme') || 'light'
  const theme = ref(savedTheme)

  // Wende gespeichertes Theme beim Start an
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  }

  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  })

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(newTheme) {
    theme.value = newTheme
  }

  return {
    theme,
    toggleTheme,
    setTheme
  }
})
