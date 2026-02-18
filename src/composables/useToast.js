import { ref } from 'vue'

const toasts = ref([])
let toastIdCounter = 0

export function useToast() {
  function showToast(type = 'info', title, options = {}) {
    const toast = {
      id: ++toastIdCounter,
      type,
      title,
      message: options.message || '',
      duration: options.duration || 3000,
      actions: options.actions || [],
      closeable: options.closeable !== false
    }

    toasts.value.push(toast)

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function showConfirmToast(type, title, message, { confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = {}) {
    return new Promise((resolve) => {
      const toast = {
        id: ++toastIdCounter,
        type,
        title,
        message,
        duration: 0,
        closeable: true,
        actions: [
          {
            label: confirmLabel,
            callback: () => {
              removeToast(toast.id)
              resolve(true)
            }
          },
          {
            label: cancelLabel,
            callback: () => {
              removeToast(toast.id)
              resolve(false)
            }
          }
        ]
      }

      toasts.value.push(toast)
    })
  }

  return {
    toasts,
    showToast,
    removeToast,
    showConfirmToast
  }
}
