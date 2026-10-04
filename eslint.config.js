import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      'node_modules/**',
      '.npm-cache/**',
      'assets/vendor/**',
      'dist/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['script.js', 'inquiry.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        gsap: 'readonly',
        ScrollTrigger: 'readonly',
        anime: 'readonly',
        Motion: 'readonly',
      },
    },
  },
  {
    files: ['eslint.config.js', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
];

