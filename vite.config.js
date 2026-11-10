import { defineConfig } from 'vite';
import path from 'node:path';
// Launch Isles: a static Vite build served from Firebase Hosting (dist/).
// The Blender packs in src/models are emitted as separate .glb files (cached by the browser),
// and @shared points at the portfolio content and loaders.
export default defineConfig({
  base: '/',
  resolve: { alias: { '@shared': path.resolve(import.meta.dirname, 'src/shared') } },
  assetsInclude: ['**/*.glb'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: (file) => (file.endsWith('.glb') ? false : undefined),
  },
});
