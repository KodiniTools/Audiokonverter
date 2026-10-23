<template>
  <div class="app-container">
    <NavControls />

    <!-- Hero: Titel + Upload -->
    <section id="converter" class="hero-section">
      <div class="container">
        <HeaderTitle />
        <FileUpload />
      </div>
    </section>

    <main class="main-content">
      <!-- Converter area: Two-column layout when files exist -->
      <div class="container">
        <div v-if="!workflowStore.isUploadStep" class="converter-area">
          <div class="converter-left">
            <FileList />
          </div>
          <div class="converter-right">
            <ConversionSettings />
            <GlobalActions />
          </div>
        </div>

        <StatusDisplay />
        <ShareButton />
      </div>

      <!-- Download, Tools, FAQ — jetzt statisches HTML in index.html -->
    </main>

    <StickyPlayer />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useAudioStore } from '@/stores/audioStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useToast } from '@/composables/useToast'
import { importSharedFiles } from '@/composables/useSharedImport'
import { getSharedFiles, clearSharedFiles } from '@/services/SharedFileRepository'
import { useI18n } from 'vue-i18n'
import NavControls from '@/components/NavControls.vue'
import HeaderTitle from '@/components/HeaderTitle.vue'
import FileUpload from '@/components/FileUpload.vue'
import FileList from '@/components/FileList.vue'
import ConversionSettings from '@/components/ConversionSettings.vue'
import GlobalActions from '@/components/GlobalActions.vue'
import StatusDisplay from '@/components/StatusDisplay.vue'
import ShareButton from '@/components/ShareButton.vue'
import StickyPlayer from '@/components/StickyPlayer.vue'
import ToastContainer from '@/components/ToastContainer.vue'

useThemeStore()
const audioStore = useAudioStore()
const workflowStore = useWorkflowStore()
useScrollReveal()
const { showToast } = useToast()
const { t } = useI18n()

onMounted(async () => {
  console.log('Audio Converter Vue App initialized')
  // Übergabe aus einem anderen Tool (z. B. Audio-Schneider: ?source=audio-cutter).
  if (!new URLSearchParams(window.location.search).has('source')) return
  try {
    const count = await importSharedFiles({
      search: window.location.search,
      getSharedFiles,
      clearSharedFiles,
      addFiles: (files) => audioStore.addFiles(files),
    })
    if (count > 0) {
      showToast('success', t('toast.fileAdded'), { message: t('import.received', { count }) })
    }
  } catch (err) {
    console.warn('Übergebene Dateien konnten nicht gelesen werden:', err)
    showToast('error', t('toast.error'), { message: t('import.failed') })
  } finally {
    // Parameter entfernen, damit ein Reload nicht erneut importiert.
    const url = new URL(window.location.href)
    url.searchParams.delete('source')
    window.history.replaceState(window.history.state, '', url.toString())
  }
})
</script>
