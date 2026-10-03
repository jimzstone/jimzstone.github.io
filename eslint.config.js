import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', '.npm-cache/**', 'assets/vendor/**'] },
  js.configs.recommended,
  {
    files: ['script.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
];
