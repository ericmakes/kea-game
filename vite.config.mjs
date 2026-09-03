import { defineConfig } from 'vite';

/* REPLAT P1. The gauntlet photographs a BUILT bundle, so the build must be predictable:
   one entry, one chunk, stable names. No hashed filenames — the capture rig and the gate
   both name the artefact, and a content hash would rename it on every pixel of change. */
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'kea.js',
        chunkFileNames: 'kea-[name].js',
        assetFileNames: 'kea.[ext]',
        manualChunks: undefined,   // one file; three is bundled in, not fetched
      },
    },
  },
  server: { port: 4320, strictPort: true },
});
