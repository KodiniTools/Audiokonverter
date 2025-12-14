<template>
  <div id="app" class="app-container">
    <NavControls />
    <main class="main-content">
      <div class="container">
        <HeaderTitle />
        <FileUpload />
        <FileList />
        <ConversionSettings />
        <GlobalActions />
        <StatusDisplay />
        <FaqSection />
      </div>
    </main>

    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import NavControls from '@/components/NavControls.vue'
import HeaderTitle from '@/components/HeaderTitle.vue'
import FileUpload from '@/components/FileUpload.vue'
import FileList from '@/components/FileList.vue'
import ConversionSettings from '@/components/ConversionSettings.vue'
import GlobalActions from '@/components/GlobalActions.vue'
import StatusDisplay from '@/components/StatusDisplay.vue'
import FaqSection from '@/components/FaqSection.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const themeStore = useThemeStore()

onMounted(() => {
  console.log('🚀 Audio Converter Vue App initialized')
  console.log('🎵 Audio Converter Vue 3 - Ready!')
})
</script>

<style>
@import '@/assets/styles/main.css';
</style>
