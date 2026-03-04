<template>
  <div class="share-section">
    <button
      class="share-btn share-btn-facebook"
      @click="shareOnFacebook"
      :title="t('share.facebook')"
    >
      <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      <span>{{ t('share.facebook') }}</span>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href)
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
  window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer')
}
</script>

<style scoped>
.share-section {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
  animation: fadeIn 0.35s ease;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.share-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.share-btn-facebook {
  background: #1877F2;
  color: #fff;
}

.share-btn-facebook:hover {
  background: #166FE5;
}

.share-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 480px) {
  .share-btn {
    font-size: 0.8rem;
    padding: 0.6rem 1rem;
    min-height: 44px;
  }
}
</style>
