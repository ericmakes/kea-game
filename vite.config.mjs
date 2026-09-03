import { defineConfig } from 'vite';

/* REPLAT P1. The gauntlet photographs a BUILT bundle, so the build must be predictable:
   one entry, one chunk, stable names. No hashed filenames — the capture rig and the gate
   both name the artefact, and a content hash would rename it on every pixel of change. */
/* REPLAT P2: assets/ IS THE PUBLIC DIR. The HDRI environment is a 1.5MB binary that is
   fetched at runtime by URL, not bundled — an ArrayBuffer inlined into kea.js would bloat the
   one chunk the capture rig and the gate both name, and RGBELoader wants a URL anyway. Pointing
   publicDir at assets/ copies the whole asset tier through verbatim, licences included, so
   dist/ carries assets/LICENCES.md next to the files it licenses. Named `assets` and not
   `public` because REPLAT.md section 1 names that directory as the place an asset lands. */
export default defineConfig({
  base: './',
  publicDir: 'assets',
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
