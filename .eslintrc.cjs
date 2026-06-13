/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier'],
  plugins: ['vue', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Prettier-Fehler als ESLint-Fehler anzeigen
    'prettier/prettier': 'error',

    // Vue-spezifische Regeln
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/prop-name-casing': ['error', 'camelCase'],
    'vue/require-default-prop': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: { void: 'always', normal: 'never', component: 'always' },
        svg: 'always',
        math: 'always',
      },
    ],
    'vue/attributes-order': 'warn',

    // Allgemeine JS-Regeln
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
    'no-debugger': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'multi-line'],
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
}
