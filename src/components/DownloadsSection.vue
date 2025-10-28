<template>
  <div class="downloads-section">
    <!-- Promo Section -->
    <div class="downloads-hero">
      <h2 class="downloads-title">{{ t('downloads.title') }}</h2>
      <p class="downloads-subtitle">{{ t('downloads.subtitle') }}</p>
    </div>

    <!-- Downloads Grid -->
    <div class="downloads-grid">
      <!-- Windows EXE -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-windows"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.windows.exe.name') }}</h3>
        <p class="download-description">{{ t('downloads.windows.exe.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('windows-exe')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Windows MSI -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-windows"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.windows.msi.name') }}</h3>
        <p class="download-description">{{ t('downloads.windows.msi.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('windows-msi')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- macOS DMG -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-apple"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.macos.name') }}</h3>
        <p class="download-description">{{ t('downloads.macos.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('macos-dmg')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Linux DEB -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-linux"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.linux.deb.name') }}</h3>
        <p class="download-description">{{ t('downloads.linux.deb.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('linux-deb')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Linux AppImage -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fab fa-linux"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.linux.appimage.name') }}</h3>
        <p class="download-description">{{ t('downloads.linux.appimage.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('linux-appimage')">
          <i class="fas fa-download"></i>
          {{ t('downloads.downloadButton') }}
        </button>
      </div>

      <!-- Portable ZIP -->
      <div class="download-card">
        <div class="download-icon">
          <i class="fas fa-file-archive"></i>
        </div>
        <h3 class="download-name">{{ t('downloads.portable.name') }}</h3>
        <p class="download-description">{{ t('downloads.portable.description') }}</p>
        <button class="btn btn-primary download-btn" @click="downloadFile('portable-zip')">
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

const { t } = useI18n()

function downloadFile(type) {
  // TODO: Implement actual download URLs
  const downloadUrls = {
    'windows-exe': '/downloads/AudioConverter-Setup.exe',
    'windows-msi': '/downloads/AudioConverter-Setup.msi',
    'macos-dmg': '/downloads/AudioConverter.dmg',
    'linux-deb': '/downloads/AudioConverter.deb',
    'linux-appimage': '/downloads/AudioConverter.AppImage',
    'portable-zip': '/downloads/AudioConverter-Portable.zip'
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
