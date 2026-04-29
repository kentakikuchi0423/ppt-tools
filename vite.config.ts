import { defineConfig } from 'vite';

// Office Add-in entries (taskpane.html / commands.html) are added in TASKS.md task 2.
// Until then, `npm run build` will fail because no entry HTML exists — this is expected.
// `npm run dev` will start a dev server on port 3000; HTTPS is wired in once
// office-addin-dev-certs has been installed (see README "Manual sideload" section).
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
});
