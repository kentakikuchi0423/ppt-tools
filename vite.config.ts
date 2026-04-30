import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

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

// Force every response to be uncacheable. Without this the WebView2 inside
// PowerPoint happily clings to a stale taskpane.html across reloads, which
// makes "I just edited the page but PowerPoint shows yesterday's HTML"
// debugging sessions painful.
function noCacheHeadersPlugin(): Plugin {
  return {
    name: 'ppt-tools-no-cache-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
      });
    },
  };
}

export default defineConfig(async ({ command }) => {
  const https = command === 'serve' ? await readDevCerts() : undefined;
  return {
    // Relative asset paths in the built HTML so the same `dist/` works
    // regardless of where it's served — root of localhost during dev,
    // a sub-path on GitHub Pages, a CDN, etc.
    base: command === 'build' ? './' : '/',
    plugins: [noCacheHeadersPlugin()],
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
