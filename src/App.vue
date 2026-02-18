<template>
  <div id="app" class="app-container">
    <NavControls />

    <!-- Hero Section: Full-width gradient with title + upload -->
    <section class="hero-section">
      <div class="container">
        <HeaderTitle />
        <FileUpload />
      </div>
    </section>

    <main class="main-content">
      <!-- Converter area: Two-column layout when files exist -->
      <div class="container">
        <div v-if="audioStore.hasFiles" class="converter-area">
          <div class="converter-left">
            <FileList />
          </div>
          <div class="converter-right">
            <ConversionSettings />
            <GlobalActions />
          </div>
        </div>

        <StatusDisplay />
      </div>

      <!-- Download Section: Full-width alt background -->
      <div class="full-width-section full-width-section--alt" data-reveal>
        <div class="container">
          <DownloadSection />
        </div>
      </div>

      <!-- Tool Cards -->
      <div class="full-width-section" data-reveal>
        <div class="container">
          <ToolCards />
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="full-width-section full-width-section--alt" data-reveal>
        <div class="container">
          <FaqSection />
        </div>
      </div>
    </main>

    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useAudioStore } from '@/stores/audioStore'
import { useScrollReveal } from '@/composables/useScrollReveal'
import NavControls from '@/components/NavControls.vue'
import HeaderTitle from '@/components/HeaderTitle.vue'
import FileUpload from '@/components/FileUpload.vue'
import FileList from '@/components/FileList.vue'
import ConversionSettings from '@/components/ConversionSettings.vue'
import GlobalActions from '@/components/GlobalActions.vue'
import StatusDisplay from '@/components/StatusDisplay.vue'
import DownloadSection from '@/components/DownloadSection.vue'
import ToolCards from '@/components/ToolCards.vue'
import FaqSection from '@/components/FaqSection.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const themeStore = useThemeStore()
const audioStore = useAudioStore()
useScrollReveal()

onMounted(() => {
  console.log('Audio Converter Vue App initialized')
})
</script>

<style>
@import '@/assets/styles/main.css';
</style>
