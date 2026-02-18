<template>
  <div class="tools-section">
    <h2 class="tools-title">{{ t('tools.title') }}</h2>
    <div class="section-divider"></div>

    <div class="tools-grid">
      <a
        v-for="(tool, index) in tools"
        :key="tool.key"
        :href="tool.link"
        class="tool-card glass-card"
        :style="{ '--stagger': index }"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="tool-card-icon">
          <i :class="tool.icon"></i>
        </div>
        <h3 class="tool-card-title">{{ t(`tools.${tool.key}.title`) }}</h3>
        <p class="tool-card-desc">{{ t(`tools.${tool.key}.description`) }}</p>
        <span class="tool-card-link">
          {{ t('tools.visitTool') }} <i class="fas fa-arrow-right"></i>
        </span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tools = [
  {
    key: 'visualizer',
    icon: 'fas fa-wave-square',
    link: 'https://kodinitools.com/visualizer/'
  },
  {
    key: 'normalizer',
    icon: 'fas fa-sliders-h',
    link: 'https://kodinitools.com/audionormalisierer/'
  },
  {
    key: 'equalizer',
    icon: 'fas fa-music',
    link: 'https://kodinitools.com/equaliser19/'
  }
]
</script>

<style scoped>
.tools-section {
  margin: 0;
  padding: 0;
}

.tools-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 0.5rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  max-width: 1000px;
  margin: 0 auto;
}

.tool-card {
  padding: 1.5rem 1.25rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: staggerIn 0.5s ease both;
  animation-delay: calc(var(--stagger, 0) * 0.1s);
}

.tool-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 12px 40px rgba(1, 79, 153, 0.15);
  transform: translateY(-6px) scale(1.02);
}

@keyframes staggerIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tool-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.tool-card-icon i {
  font-size: 1.25rem;
  color: #F5F4D6;
  transition: transform 0.3s ease;
}

.tool-card:hover .tool-card-icon {
  transform: scale(1.1) rotate(5deg);
}

.tool-card:hover .tool-card-icon i {
  transform: scale(1.05);
}

.tool-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem;
}

.tool-card-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 1rem;
  flex: 1;
}

.tool-card-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-color);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: gap 0.2s ease;
}

.tool-card:hover .tool-card-link {
  gap: 0.6rem;
  color: var(--accent-color);
}

@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .tools-title {
    font-size: 1.1rem;
  }

  .tool-card {
    padding: 1.25rem 1rem;
  }
}

@media (min-width: 769px) and (max-width: 960px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .tools-title {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .tools-grid {
    gap: 0.75rem;
  }

  .tool-card {
    padding: 1rem 0.85rem;
  }

  .tool-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    margin-bottom: 0.75rem;
  }

  .tool-card-icon i {
    font-size: 1.1rem;
  }

  .tool-card-title {
    font-size: 0.9rem;
  }

  .tool-card-desc {
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .tool-card-link {
    font-size: 0.75rem;
  }
}
</style>
