<template>
  <div class="download-section">
    <h2 class="download-title">{{ t('download.title') }}</h2>
    <p class="download-subtitle">{{ t('download.subtitle') }}</p>

    <div class="download-grid">
      <!-- Windows Installer -->
      <div class="download-card">
        <div class="download-card-header">
          <i class="fab fa-windows"></i>
          <h3>{{ t('download.installer.title') }}</h3>
        </div>
        <p class="download-card-desc">{{ t('download.installer.description') }}</p>
        <div class="download-buttons">
          <a :href="baseUrl + 'AudioConverter-Setup.exe'" class="download-btn primary">
            <i class="fas fa-download"></i>
            {{ t('download.installer.exe') }}
          </a>
          <div class="download-alt">
            <a :href="baseUrl + 'AudioConverter-Setup-x64.msi'" class="download-btn secondary">
              <i class="fas fa-download"></i>
              MSI (64-bit)
            </a>
            <a :href="baseUrl + 'AudioConverter-Setup-x86.msi'" class="download-btn secondary">
              <i class="fas fa-download"></i>
              MSI (32-bit)
            </a>
          </div>
        </div>
      </div>

      <!-- Portable Version -->
      <div class="download-card">
        <div class="download-card-header">
          <i class="fas fa-folder-open"></i>
          <h3>{{ t('download.portable.title') }}</h3>
        </div>
        <p class="download-card-desc">{{ t('download.portable.description') }}</p>
        <div class="download-buttons">
          <a :href="baseUrl + 'AudioConverter-Portable-x64.zip'" class="download-btn primary">
            <i class="fas fa-download"></i>
            {{ t('download.portable.x64') }}
          </a>
          <a :href="baseUrl + 'AudioConverter-Portable-x86.zip'" class="download-btn secondary">
            <i class="fas fa-download"></i>
            {{ t('download.portable.x86') }}
          </a>
        </div>
      </div>
    </div>

    <p class="download-note">
      <i class="fas fa-info-circle"></i>
      {{ t('download.note') }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const baseUrl = '/audiokonverter/downloads/'
</script>

<style scoped>
.download-section {
  margin: 2rem 0;
  padding: 1.5rem 0;
  animation: fadeIn 0.5s ease;
}

.download-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 0.5rem;
}

.download-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.download-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  max-width: 700px;
  margin: 0 auto;
}

.download-card {
  background: var(--card-background);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.download-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(1, 79, 153, 0.15);
}

.download-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.download-card-header i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.download-card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.download-card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.download-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.download-alt {
  display: flex;
  gap: 0.5rem;
}

.download-alt .download-btn {
  flex: 1;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.download-btn.primary {
  background: var(--primary-color);
  color: #F5F4D6;
}

.download-btn.primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.download-btn.secondary {
  background: rgba(1, 79, 153, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(1, 79, 153, 0.2);
}

.download-btn.secondary:hover {
  background: rgba(1, 79, 153, 0.2);
  transform: translateY(-1px);
}

.download-btn i {
  font-size: 0.9rem;
}

.download-note {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.download-note i {
  color: var(--primary-color);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .download-title {
    font-size: 1.1rem;
  }

  .download-grid {
    grid-template-columns: 1fr;
  }

  .download-alt {
    flex-direction: column;
  }

  .download-card {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .download-section {
    margin: 1.5rem 0;
    padding: 1rem 0;
  }

  .download-title {
    font-size: 1rem;
    margin-bottom: 0.35rem;
  }

  .download-subtitle {
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }

  .download-card {
    padding: 0.85rem;
    border-radius: 10px;
  }

  .download-card-header i {
    font-size: 1.25rem;
  }

  .download-card-header h3 {
    font-size: 0.9rem;
  }

  .download-card-desc {
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
  }

  .download-btn {
    padding: 0.6rem 0.85rem;
    font-size: 0.8rem;
    min-height: 44px;
  }

  .download-note {
    font-size: 0.75rem;
    margin-top: 1rem;
  }
}
</style>
