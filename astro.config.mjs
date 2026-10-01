import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mehfoozurrehmanv8.web.app',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  prefetch: { defaultStrategy: 'hover' },
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
