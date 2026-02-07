<template>
  <div class="faq-section">
    <h2 class="faq-title">{{ t('faq.title') }}</h2>

    <div class="faq-grid">
      <div
        v-for="(faq, key) in faqs"
        :key="key"
        class="faq-item"
        :class="{ active: activeFaq === key }"
        @click="toggleFaq(key)"
      >
        <div class="faq-question">
          <span>{{ faq.q }}</span>
          <i :class="activeFaq === key ? 'fas fa-minus' : 'fas fa-plus'"></i>
        </div>
        <Transition name="faq">
          <div v-if="activeFaq === key" class="faq-answer">
            <p>{{ faq.a }}</p>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()
const activeFaq = ref(null)

const faqs = computed(() => tm('faq.questions'))

function toggleFaq(key) {
  activeFaq.value = activeFaq.value === key ? null : key
}
</script>

<style scoped>
.faq-section {
  margin: 2rem 0 1rem;
  padding: 1.5rem 0;
  animation: fadeIn 0.5s ease;
}

.faq-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 1.25rem;
}

.faq-grid {
  display: grid;
  gap: 0.6rem;
  max-width: 700px;
  margin: 0 auto;
}

.faq-item {
  background: var(--card-background);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.faq-item:hover {
  border-color: var(--primary-color);
}

.faq-item.active {
  border-color: var(--primary-color);
  box-shadow: 0 2px 12px rgba(1, 79, 153, 0.15);
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.faq-question span {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.faq-question i {
  color: var(--primary-color);
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.faq-answer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(1, 79, 153, 0.12);
}

.faq-answer p {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  font-size: 0.85rem;
}

.faq-enter-active,
.faq-leave-active {
  transition: all 0.2s ease;
}

.faq-enter-from,
.faq-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .faq-title {
    font-size: 1.1rem;
  }

  .faq-item {
    padding: 0.85rem;
  }

  .faq-question span {
    font-size: 0.85rem;
  }
}
</style>
