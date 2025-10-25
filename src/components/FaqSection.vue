<template>
  <div class="faq-section">
    <h2 class="faq-title">{{ t('faq.title') }}</h2>
    
    <div class="faq-grid">
      <div
        v-for="(faq, key) in faqs"
        :key="key"
        class="faq-item"
        @click="toggleFaq(key)"
      >
        <div class="faq-question">
          <h4>{{ faq.q }}</h4>
          <i :class="activeFaq === key ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
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

const { t, tm } = useI18n() // <-- Änderung 1: 'tm' importieren
const activeFaq = ref(null)

// <-- Änderung 2: 'tm' statt 't' verwenden, um das Objekt abzurufen
const faqs = computed(() => tm('faq.questions'))

function toggleFaq(key) {
  activeFaq.value = activeFaq.value === key ? null : key
}
</script>

<style scoped>
.faq-section {
  margin: 4rem 0 2rem;
  padding: 2rem 0;
  animation: fadeIn 0.8s ease;
}

.faq-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 2rem;
}

.faq-grid {
  display: grid;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: var(--card-background);
  border: 1px solid rgba(184, 184, 184, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.faq-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.faq-question h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.faq-question i {
  color: var(--primary-color);
  font-size: 1rem;
  transition: transform 0.3s ease;
}

.faq-answer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(184, 184, 184, 0.1);
}

.faq-answer p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.faq-enter-active,
.faq-leave-active {
  transition: all 0.3s ease;
}

.faq-enter-from,
.faq-leave-to {
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
  .faq-title {
    font-size: 1.5rem;
  }

  .faq-item {
    padding: 1.25rem;
  }

  .faq-question h4 {
    font-size: 1rem;
  }
}
</style>