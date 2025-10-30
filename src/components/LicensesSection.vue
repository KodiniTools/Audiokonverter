<template>
  <div class="licenses-section">
    <h2 class="licenses-title">{{ t('licenses.title') }}</h2>
    <p class="licenses-subtitle">{{ t('licenses.subtitle') }}</p>

    <div class="licenses-grid">
      <div
        v-for="(license, key) in licenses"
        :key="key"
        class="license-item"
        @click="toggleLicense(key)"
      >
        <div class="license-header">
          <div class="license-info">
            <h4>{{ license.name }}</h4>
            <span class="license-type">{{ license.type }}</span>
          </div>
          <i :class="activeLicense === key ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <Transition name="license">
          <div v-if="activeLicense === key" class="license-details">
            <p class="license-description">{{ license.description }}</p>
            <div class="license-links">
              <a v-if="license.url" :href="license.url" target="_blank" rel="noopener noreferrer" class="license-link">
                <i class="fas fa-external-link-alt"></i>
                {{ t('licenses.homepage') }}
              </a>
              <a v-if="license.licenseUrl" :href="license.licenseUrl" target="_blank" rel="noopener noreferrer" class="license-link">
                <i class="fas fa-file-contract"></i>
                {{ t('licenses.licenseText') }}
              </a>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="licenses-footer">
      <p>{{ t('licenses.footer') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()
const activeLicense = ref(null)

const licenses = computed(() => tm('licenses.items'))

function toggleLicense(key) {
  activeLicense.value = activeLicense.value === key ? null : key
}
</script>

<style scoped>
.licenses-section {
  margin: 4rem 0 2rem;
  padding: 2rem 0;
  animation: fadeIn 0.8s ease;
}

.licenses-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 0.5rem;
}

.licenses-subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.licenses-grid {
  display: grid;
  gap: 1rem;
  max-width: 900px;
  margin: 0 auto;
}

.license-item {
  background: var(--card-background);
  border: 1px solid rgba(184, 184, 184, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.license-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.license-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.license-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.license-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.license-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.license-header i {
  color: var(--primary-color);
  font-size: 1rem;
  transition: transform 0.3s ease;
}

.license-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(184, 184, 184, 0.1);
}

.license-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
}

.license-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.license-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.license-link:hover {
  background: var(--primary-hover);
  transform: translateX(2px);
}

.license-link i {
  font-size: 0.875rem;
}

.licenses-footer {
  max-width: 900px;
  margin: 2rem auto 0;
  padding: 1.5rem;
  background: var(--card-background);
  border: 1px solid rgba(184, 184, 184, 0.2);
  border-radius: 12px;
  text-align: center;
}

.licenses-footer p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-size: 0.9rem;
}

.license-enter-active,
.license-leave-active {
  transition: all 0.3s ease;
}

.license-enter-from,
.license-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .licenses-title {
    font-size: 1.5rem;
  }

  .licenses-subtitle {
    font-size: 0.875rem;
  }

  .license-item {
    padding: 1.25rem;
  }

  .license-info h4 {
    font-size: 1rem;
  }

  .license-type {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
  }

  .license-links {
    flex-direction: column;
  }

  .license-link {
    justify-content: center;
  }
}
</style>
