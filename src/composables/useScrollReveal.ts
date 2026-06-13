import { onMounted, onUnmounted } from 'vue'

export function useScrollReveal(): void {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        el.classList.add('revealed')
      })
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const delay = parseInt((entry.target as HTMLElement).dataset.revealDelay ?? '0', 10)
          if (delay > 0) {
            setTimeout(() => entry.target.classList.add('revealed'), delay)
          } else {
            entry.target.classList.add('revealed')
          }
          observer?.unobserve(entry.target)
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    document.querySelectorAll('[data-reveal]').forEach((el) => observer?.observe(el))
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}
