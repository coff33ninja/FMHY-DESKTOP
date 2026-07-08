const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    ignores: ['dist/', 'node_modules/', '*.json'],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        MutationObserver: 'readonly',
        atob: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        document: 'readonly',
        window: 'readonly',
        fmhyAPI: 'readonly',
        electronAPI: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-case-declarations': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'always'],
      curly: ['warn', 'multi-line'],
      'no-var': 'error',
    },
  },
];
