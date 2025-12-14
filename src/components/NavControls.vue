<template>
  <!-- Renderless component - injects controls into SSI nav -->
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/themeStore'
import { setLocale } from '@/locales'

const { t, locale } = useI18n()
const themeStore = useThemeStore()

const currentLocale = computed(() => locale.value)

let controlsContainer = null

function toggleLanguage() {
  const newLocale = locale.value === 'de' ? 'en' : 'de'
  setLocale(newLocale)
  updateControls()
}

function toggleTheme() {
  themeStore.toggleTheme()
  updateControls()
}

function createControls() {
  // Find the SSI navigation
  const nav = document.querySelector('nav, .navbar, .nav, header nav, [class*="nav"]')
  if (!nav) {
    console.warn('NavControls: Navigation element not found, retrying...')
    setTimeout(createControls, 100)
    return
  }

  // Check if controls already exist
  if (document.getElementById('vue-nav-controls')) return

  // Create controls container
  controlsContainer = document.createElement('div')
  controlsContainer.id = 'vue-nav-controls'
  controlsContainer.className = 'nav-controls'
  controlsContainer.innerHTML = `
    <button class="nav-btn language-toggle" id="lang-toggle" title="${t('nav.language')}">
      <span class="current-lang">${currentLocale.value.toUpperCase()}</span>
      <i class="fas fa-globe"></i>
    </button>
    <button class="nav-btn theme-toggle" id="theme-toggle" title="${t('nav.toggleTheme')}">
      <i class="${themeStore.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}"></i>
    </button>
  `

  // Find nav-actions or similar container, or append to nav
  const navActions = nav.querySelector('.nav-actions, .nav-right, .navbar-right, .nav-end')
  if (navActions) {
    navActions.appendChild(controlsContainer)
  } else {
    // Create wrapper and append to nav
    const navContainer = nav.querySelector('.nav-container, .container, .navbar-container') || nav
    navContainer.appendChild(controlsContainer)
  }

  // Add event listeners
  document.getElementById('lang-toggle')?.addEventListener('click', toggleLanguage)
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme)

  // Add styles
  addStyles()
}

function updateControls() {
  const langBtn = document.getElementById('lang-toggle')
  const themeBtn = document.getElementById('theme-toggle')

  if (langBtn) {
    const langSpan = langBtn.querySelector('.current-lang')
    if (langSpan) langSpan.textContent = currentLocale.value.toUpperCase()
  }

  if (themeBtn) {
    const icon = themeBtn.querySelector('i')
    if (icon) {
      icon.className = themeStore.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'
    }
  }
}

function addStyles() {
  if (document.getElementById('nav-controls-styles')) return

  const style = document.createElement('style')
  style.id = 'nav-controls-styles'
  style.textContent = `
    .nav-controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .nav-controls .nav-btn {
      background: transparent;
      border: 2px solid rgba(144, 144, 144, 0.2);
      color: var(--text-color, #333);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .nav-controls .nav-btn:hover {
      background: var(--primary-color, #6366f1);
      color: white;
      border-color: var(--primary-color, #6366f1);
      transform: translateY(-2px);
    }

    .nav-controls .current-lang {
      font-weight: 600;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .nav-controls .nav-btn {
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
      }
    }
  `
  document.head.appendChild(style)
}

function removeControls() {
  document.getElementById('lang-toggle')?.removeEventListener('click', toggleLanguage)
  document.getElementById('theme-toggle')?.removeEventListener('click', toggleTheme)
  controlsContainer?.remove()
  document.getElementById('nav-controls-styles')?.remove()
}

onMounted(() => {
  // Wait for SSI content to be loaded
  if (document.readyState === 'complete') {
    createControls()
  } else {
    window.addEventListener('load', createControls)
  }
})

onUnmounted(() => {
  window.removeEventListener('load', createControls)
  removeControls()
})
</script>
