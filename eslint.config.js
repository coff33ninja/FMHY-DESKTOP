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
        console: 'readonly',
        setTimeout: 'readonly',
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
      eqeqeq: ['error', 'always'],
      curly: ['warn', 'multi-line'],
      'no-var': 'error',
    },
  },
];
