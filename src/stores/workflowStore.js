import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAudioStore } from './audioStore'

/**
 * Workflow steps — the high-level states the converter can be in.
 * Derived reactively from audioStore; never set manually.
 */
export const WORKFLOW_STEPS = {
  UPLOAD: 'upload',
  CONFIGURE: 'configure',
  CONVERTING: 'converting',
  COMPLETED: 'completed'
}

export const useWorkflowStore = defineStore('workflow', () => {
  const audioStore = useAudioStore()

  // ── Derived workflow step ────────────────────────────────────────────
  const currentStep = computed(() => {
    if (audioStore.isConverting) return WORKFLOW_STEPS.CONVERTING
    if (!audioStore.hasFiles) return WORKFLOW_STEPS.UPLOAD

    const allDone = audioStore.audioFiles.every(
      f => f.status === 'completed' || f.status === 'error'
    )
    if (allDone && audioStore.hasConvertedFiles) return WORKFLOW_STEPS.COMPLETED

    return WORKFLOW_STEPS.CONFIGURE
  })

  // ── File summary ─────────────────────────────────────────────────────
  const fileSummary = computed(() => {
    const files = audioStore.audioFiles
    return {
      total: files.length,
      pending: files.filter(f => f.status === 'pending').length,
      converting: files.filter(f => f.status === 'converting').length,
      completed: files.filter(f => f.status === 'completed').length,
      error: files.filter(f => f.status === 'error').length
    }
  })

  // ── Overall progress (0–100) ─────────────────────────────────────────
  const overallProgress = computed(() => {
    const files = audioStore.audioFiles
    if (files.length === 0) return 0
    const sum = files.reduce((acc, f) => acc + (f.progress || 0), 0)
    return Math.round(sum / files.length)
  })

  // ── Processing-mode breakdown ────────────────────────────────────────
  const processingModeSummary = computed(() => {
    const files = audioStore.audioFiles
    return {
      local: files.filter(f => f.processedLocally).length,
      server: files.filter(f => !f.processedLocally).length,
      wasmReady: audioStore.wasmReady,
      wasmLoading: audioStore.wasmLoading
    }
  })

  // ── Step convenience booleans ────────────────────────────────────────
  const isUploadStep = computed(() => currentStep.value === WORKFLOW_STEPS.UPLOAD)
  const isConfigureStep = computed(() => currentStep.value === WORKFLOW_STEPS.CONFIGURE)
  const isConvertingStep = computed(() => currentStep.value === WORKFLOW_STEPS.CONVERTING)
  const isCompletedStep = computed(() => currentStep.value === WORKFLOW_STEPS.COMPLETED)

  // ── Action guards ────────────────────────────────────────────────────
  const canStartConversion = computed(() => {
    return audioStore.hasFiles &&
      !audioStore.isConverting &&
      (fileSummary.value.pending > 0 || fileSummary.value.error > 0)
  })

  const canDownload = computed(() => fileSummary.value.completed > 0)
  const hasErrors = computed(() => fileSummary.value.error > 0)

  // ── Workflow transition tracking ─────────────────────────────────────
  const lastTransition = ref(null)

  watch(currentStep, (to, from) => {
    if (from && to !== from) {
      lastTransition.value = { from, to, at: Date.now() }
    }
  })

  return {
    // Step
    currentStep,
    isUploadStep,
    isConfigureStep,
    isConvertingStep,
    isCompletedStep,

    // Summaries
    fileSummary,
    overallProgress,
    processingModeSummary,

    // Guards
    canStartConversion,
    canDownload,
    hasErrors,

    // Tracking
    lastTransition,

    // Constants (for external comparison)
    STEPS: WORKFLOW_STEPS
  }
})
