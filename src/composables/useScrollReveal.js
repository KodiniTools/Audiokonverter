import { onMounted, onUnmounted } from 'vue'

/**
 * Composable for scroll-based reveal animations using IntersectionObserver.
 * Elements with [data-reveal] will animate in when they enter the viewport.
 * Optional: data-reveal-delay="100" for staggered animations (ms).
 */
export function useScrollReveal() {
  let observer = null

  onMounted(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      // Make all elements visible immediately
      document.querySelectorAll('[data-reveal]').forEach(el => {
        el.classList.add('revealed')
      })
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.revealDelay || '0', 10)
            if (delay > 0) {
              setTimeout(() => {
                entry.target.classList.add('revealed')
              }, delay)
            } else {
              entry.target.classList.add('revealed')
            }
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    )

    // Observe all elements with data-reveal attribute
    document.querySelectorAll('[data-reveal]').forEach(el => {
      observer.observe(el)
    })
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })
}
