import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAudioStore } from './audioStore'
import type { WorkflowStep, FileSummary, ProcessingModeSummary, WorkflowTransition } from '@/types'

export const WORKFLOW_STEPS = {
  UPLOAD: 'upload' as WorkflowStep,
  CONFIGURE: 'configure' as WorkflowStep,
  CONVERTING: 'converting' as WorkflowStep,
  COMPLETED: 'completed' as WorkflowStep,
}

export const useWorkflowStore = defineStore('workflow', () => {
  const audioStore = useAudioStore()

  const currentStep = computed<WorkflowStep>(() => {
    if (audioStore.isConverting) return WORKFLOW_STEPS.CONVERTING
    if (!audioStore.hasFiles) return WORKFLOW_STEPS.UPLOAD

    const allDone = audioStore.audioFiles.every(
      (f) => f.status === 'completed' || f.status === 'error'
    )
    if (allDone && audioStore.hasConvertedFiles) return WORKFLOW_STEPS.COMPLETED

    return WORKFLOW_STEPS.CONFIGURE
  })

  const fileSummary = computed<FileSummary>(() => {
    const files = audioStore.audioFiles
    return {
      total: files.length,
      pending: files.filter((f) => f.status === 'pending').length,
      converting: files.filter((f) => f.status === 'converting').length,
      completed: files.filter((f) => f.status === 'completed').length,
      error: files.filter((f) => f.status === 'error').length,
    }
  })

  const overallProgress = computed<number>(() => {
    const files = audioStore.audioFiles
    if (files.length === 0) return 0
    const sum = files.reduce((acc, f) => acc + (f.progress ?? 0), 0)
    return Math.round(sum / files.length)
  })

  const processingModeSummary = computed<ProcessingModeSummary>(() => ({
    local: audioStore.audioFiles.filter((f) => f.processedLocally).length,
    server: audioStore.audioFiles.filter((f) => !f.processedLocally).length,
    wasmReady: audioStore.wasmReady,
    wasmLoading: audioStore.wasmLoading,
  }))

  const isUploadStep = computed(() => currentStep.value === WORKFLOW_STEPS.UPLOAD)
  const isConfigureStep = computed(() => currentStep.value === WORKFLOW_STEPS.CONFIGURE)
  const isConvertingStep = computed(() => currentStep.value === WORKFLOW_STEPS.CONVERTING)
  const isCompletedStep = computed(() => currentStep.value === WORKFLOW_STEPS.COMPLETED)

  const canStartConversion = computed(
    () =>
      audioStore.hasFiles &&
      !audioStore.isConverting &&
      (fileSummary.value.pending > 0 || fileSummary.value.error > 0)
  )

  const canDownload = computed(() => fileSummary.value.completed > 0)
  const hasErrors = computed(() => fileSummary.value.error > 0)

  const lastTransition = ref<WorkflowTransition | null>(null)

  watch(currentStep, (to, from) => {
    if (from && to !== from) {
      lastTransition.value = { from, to, at: Date.now() }
    }
  })

  return {
    currentStep,
    isUploadStep,
    isConfigureStep,
    isConvertingStep,
    isCompletedStep,
    fileSummary,
    overallProgress,
    processingModeSummary,
    canStartConversion,
    canDownload,
    hasErrors,
    lastTransition,
    STEPS: WORKFLOW_STEPS,
  }
})
