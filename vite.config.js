import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, copyFileSync } from 'node:fs';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    tailwindcss(),
    {
      name: 'portfolio-static-assets',
      closeBundle() {
        cpSync('assets', 'dist/assets', { recursive: true });
        for (const file of [
          'script.js',
          'inquiry.js',
          'project-slideshow.js',
          'effects.json',
          'favicon.svg',
          '.nojekyll',
        ])
          copyFileSync(file, `dist/${file}`);
      },
    },
  ],
});

