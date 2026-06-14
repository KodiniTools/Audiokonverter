import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  const savedTheme = (localStorage.getItem('theme') as Theme) ?? 'light'
  const theme = ref<Theme>(savedTheme)

  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  }

  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  })

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(newTheme: Theme): void {
    theme.value = newTheme
  }

  return { theme, toggleTheme, setTheme }
})
