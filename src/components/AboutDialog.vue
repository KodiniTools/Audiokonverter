<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="closeModal">
        <i class="fas fa-times"></i>
      </button>

      <div class="about-header">
        <i class="fas fa-music app-icon"></i>
        <h2>Audio Konverter</h2>
        <p class="version">Version 2.0.0</p>
        <p class="copyright">© 2024 Kodini Tools</p>
      </div>

      <div class="about-content">
        <section class="section">
          <h3>{{ t('about.description') }}</h3>
          <p>{{ t('about.descriptionText') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('about.openSource') }}</h3>
          <p>{{ t('about.openSourceText') }}</p>

          <div class="license-list">
            <div class="license-item">
              <strong>FFmpeg</strong>
              <span>LGPL v2.1</span>
              <a href="https://ffmpeg.org/" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt"></i>
              </a>
            </div>

            <div class="license-item">
              <strong>Vue.js</strong>
              <span>MIT License</span>
              <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt"></i>
              </a>
            </div>

            <div class="license-item">
              <strong>Font Awesome</strong>
              <span>Font Awesome Free License</span>
              <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt"></i>
              </a>
            </div>

            <div class="license-item">
              <strong>JSZip, Axios, Pinia</strong>
              <span>MIT License</span>
            </div>
          </div>

          <button class="btn-secondary" @click="openLicenses">
            <i class="fas fa-file-contract"></i>
            {{ t('about.viewLicenses') }}
          </button>
        </section>

        <section class="section">
          <h3>{{ t('about.contact') }}</h3>
          <p>Kodini Tools</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const isOpen = ref(false)

function openModal() {
  isOpen.value = true
}

function closeModal() {
  isOpen.value = false
}

function openLicenses() {
  // Open licenses in new tab
  window.open('/audiokonverter/LICENSES.txt', '_blank')
}

defineExpose({
  openModal,
  closeModal
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: var(--card-background);
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideInUp 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(144, 144, 144, 0.2);
  color: var(--text-color);
}

.about-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgba(144, 144, 144, 0.2);
}

.app-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.about-header h2 {
  font-size: 2rem;
  margin: 0.5rem 0;
  color: var(--text-color);
}

.version {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0.5rem 0;
}

.copyright {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.about-content {
  color: var(--text-color);
}

.section {
  margin-bottom: 2rem;
}

.section h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: var(--text-color);
}

.section p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.license-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.license-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(144, 144, 144, 0.1);
  border-radius: 8px;
  gap: 1rem;
}

.license-item strong {
  flex: 1;
  color: var(--text-color);
}

.license-item span {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.license-item a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

.license-item a:hover {
  color: var(--accent-color);
}

.btn-secondary {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: rgba(144, 144, 144, 0.1);
  color: var(--text-color);
  border: 2px solid rgba(144, 144, 144, 0.2);
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-secondary:hover {
  background: rgba(144, 144, 144, 0.2);
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(184, 184, 184, 0.1);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(144, 144, 144, 0.4);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 90%;
    padding: 1.5rem;
  }

  .app-icon {
    font-size: 3rem;
  }

  .about-header h2 {
    font-size: 1.5rem;
  }
}
</style>
