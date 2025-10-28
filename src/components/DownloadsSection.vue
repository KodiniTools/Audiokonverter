<template>
  <div class="downloads-section">
    <!-- Promo Section -->
    <div class="downloads-hero">
      <h2 class="downloads-title">{{ t('downloads.title') }}</h2>
      <p class="downloads-subtitle">{{ t('downloads.subtitle') }}</p>
    </div>

    <!-- Windows Defender Warning -->
    <div class="security-warning">
      <div class="warning-icon">
        <i class="fas fa-shield-alt"></i>
      </div>
      <div class="warning-content">
        <h3 class="warning-title">{{ t('downloads.securityWarning.title') }}</h3>
        <p class="warning-text">{{ t('downloads.securityWarning.description') }}</p>
        <details class="warning-details">
          <summary>{{ t('downloads.securityWarning.learnMore') }}</summary>
          <div class="warning-steps">
            <p><strong>{{ t('downloads.securityWarning.why.title') }}</strong></p>
            <p>{{ t('downloads.securityWarning.why.description') }}</p>

            <p><strong>{{ t('downloads.securityWarning.howToInstall.title') }}</strong></p>
            <ol>
              <li v-for="(step, index) in tm('downloads.securityWarning.howToInstall.steps')" :key="index">
                {{ step }}
              </li>
            </ol>

            <p class="warning-recommendation">
              <i class="fas fa-lightbulb"></i>
              {{ t('downloads.securityWarning.recommendation') }}
            </p>
          </div>
        </details>
      </div>
    </div>

    <!-- Downloads Grid -->
    <div class="downloads-grid">
      <!-- Portable ZIP 64-bit (Empfohlen) -->
      <div class="download-card featured">
        <div class="download-badge">{{ t('downloads.recommended') }}</div>
        <div class="download-icon">
          <i class="fas fa-file-archive"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.portable64.name') }}</h3>
        <p class="download-description">{{ t('downloads.portable64.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('portable-zip-x64')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Windows EXE 64-bit -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-windows"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.windows.exe.name') }}</h3>
        <p class="download-description">{{ t('downloads.windows.exe.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('windows-exe-x64')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Windows MSI 64-bit -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-windows"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.windows.msi64.name') }}</h3>
        <p class="download-description">{{ t('downloads.windows.msi64.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('windows-msi-x64')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Windows MSI 32-bit -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-windows"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.windows.msi32.name') }}</h3>
        <p class="download-description">{{ t('downloads.windows.msi32.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('windows-msi-x86')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Portable ZIP 32-bit -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fas fa-file-archive"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.portable32.name') }}</h3>
        <p class="download-description">{{ t('downloads.portable32.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('portable-zip-x86')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="downloads-info">
      <p class="info-text">
        <i class="fas fa-info-circle"></i>
        {{ t('downloads.systemRequirements') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

function downloadFile(type) {
  const downloadUrls = {
    'windows-exe-x64': '/audiokonverter/downloads/AudioConverter-Setup.exe',
    'windows-msi-x64': '/audiokonverter/downloads/AudioConverter-Setup-x64.msi',
    'windows-msi-x86': '/audiokonverter/downloads/AudioConverter-Setup-x86.msi',
    'portable-zip-x64': '/audiokonverter/downloads/AudioConverter-Portable-x64.zip',
    'portable-zip-x86': '/audiokonverter/downloads/AudioConverter-Portable-x86.zip'
  }

  const url = downloadUrls[type]
  if (url) {
    // Create temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = url.split('/').pop()
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
</script>

<style scoped>
.downloads-section {
  margin: 4rem 0 2rem;
  padding: 3rem 0;
  animation: fadeIn 0.8s ease;
}

.downloads-hero {
  text-align: center;
  margin-bottom: 3rem;
}

.downloads-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1rem;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.downloads-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.downloads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.download-card {
  background: var(--card-background);
  border: 1px solid rgba(184, 184, 184, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.download-card.featured {
  border: 2px solid var(--primary-color);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.download-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: var(--accent-gradient);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.download-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
  border-color: var(--primary-color);
}

.download-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}

.download-card:hover .download-icon {
  transform: scale(1.1);
}

.download-icon i {
  font-size: 2.5rem;
  color: #ffffff;
}

.download-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}

.download-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.download-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.downloads-info {
  text-align: center;
  padding: 1.5rem;
  background: var(--secondary-color);
  border-radius: 12px;
  border: 1px solid rgba(184, 184, 184, 0.1);
}

.info-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
}

.info-text i {
  color: var(--primary-color);
}

/* Security Warning Styles */
.security-warning {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
  border: 2px solid #ffa726;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 3rem;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.warning-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--warning-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}

.warning-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.warning-details {
  margin-top: 1rem;
}

.warning-details summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--primary-color);
  padding: 0.5rem 0;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
}

.warning-details summary::-webkit-details-marker {
  display: none;
}

.warning-details summary:before {
  content: '▶';
  display: inline-block;
  transition: transform 0.3s ease;
}

.warning-details[open] summary:before {
  transform: rotate(90deg);
}

.warning-details summary:hover {
  color: var(--primary-hover);
}

.warning-steps {
  padding: 1.5rem;
  background: var(--card-background);
  border-radius: 12px;
  margin-top: 1rem;
  border: 1px solid rgba(184, 184, 184, 0.2);
}

.warning-steps p {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.warning-steps strong {
  color: var(--text-color);
  font-size: 1.1rem;
}

.warning-steps ol {
  margin: 1rem 0 1.5rem 1.5rem;
  line-height: 1.8;
  color: var(--text-secondary);
}

.warning-steps li {
  margin-bottom: 0.5rem;
}

.warning-recommendation {
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid var(--primary-color);
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.warning-recommendation i {
  color: var(--primary-color);
  font-size: 1.25rem;
  margin-top: 0.2rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .downloads-title {
    font-size: 2rem;
  }

  .downloads-subtitle {
    font-size: 1rem;
  }

  .security-warning {
    flex-direction: column;
    padding: 1.5rem;
  }

  .warning-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .warning-title {
    font-size: 1.25rem;
  }

  .warning-steps {
    padding: 1rem;
  }

  .downloads-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .download-card {
    padding: 1.5rem;
  }

  .download-icon {
    width: 60px;
    height: 60px;
  }

  .download-icon i {
    font-size: 2rem;
  }
}
</style>
