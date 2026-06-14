import { ref } from 'vue'
import { i18n } from '@/locales'
import type { Toast, ToastType, ToastOptions } from '@/types'

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

export function useToast() {
  function showToast(type: ToastType = 'info', title: string, options: ToastOptions = {}): number {
    const toast: Toast = {
      id: ++toastIdCounter,
      type,
      title,
      message: options.message ?? '',
      duration: options.duration ?? 3000,
      actions: options.actions ?? [],
      closeable: options.closeable !== false,
    }

    toasts.value.push(toast)

    if (toast.duration > 0) {
      setTimeout(() => removeToast(toast.id), toast.duration)
    }

    return toast.id
  }

  function removeToast(id: number): void {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  function showConfirmToast(type: ToastType, title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const toast: Toast = {
        id: ++toastIdCounter,
        type,
        title,
        message,
        duration: 0,
        closeable: true,
        actions: [
          {
            label: i18n.global.t('actions.confirm'),
            callback: () => {
              removeToast(toast.id)
              resolve(true)
            },
          },
          {
            label: i18n.global.t('actions.cancel'),
            callback: () => {
              removeToast(toast.id)
              resolve(false)
            },
          },
        ],
      }

      toasts.value.push(toast)
    })
  }

  return { toasts, showToast, removeToast, showConfirmToast }
}
