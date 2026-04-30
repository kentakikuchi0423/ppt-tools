import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// office-addin-dev-certs is loaded asynchronously so that `npm run build` and
// other commands that don't need HTTPS still work even when certs aren't
// installed. If the certs are missing we log a warning and start the dev
// server in plain HTTP — PowerPoint will refuse to load the task pane in that
// state, but the failure mode is obvious instead of a cryptic ESM import error.
async function readDevCerts(): Promise<{ key: Buffer; cert: Buffer; ca: Buffer } | undefined> {
  try {
    const { getHttpsServerOptions } = await import('office-addin-dev-certs');
    const opts = await getHttpsServerOptions();
    return { key: opts.key, cert: opts.cert, ca: opts.ca };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[vite] office-addin-dev-certs not available (${reason}). ` +
        'Falling back to HTTP. Run `npx office-addin-dev-certs install` to enable HTTPS.',
    );
    return undefined;
  }
}

export default defineConfig(async ({ command }) => {
  const https = command === 'serve' ? await readDevCerts() : undefined;
  return {
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      ...(https ? { https } : {}),
    },
    preview: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      ...(https ? { https } : {}),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'es2022',
      rollupOptions: {
        input: {
          taskpane: resolve(import.meta.dirname, 'taskpane.html'),
          commands: resolve(import.meta.dirname, 'commands.html'),
          dialog: resolve(import.meta.dirname, 'dialog.html'),
        },
      },
    },
  };
});
