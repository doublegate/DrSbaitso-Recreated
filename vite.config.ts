import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * Security Headers Plugin (v1.11.0 - Option B4)
 * Adds security headers to development server responses
 */
function securityHeadersPlugin(): Plugin {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Content Security Policy
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://aistudiocdn.com; " +
          "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
          "img-src 'self' data: blob: https:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' https://generativelanguage.googleapis.com https://aistudiocdn.com; " +
          "media-src 'self' blob: data:; " +
          "worker-src 'self' blob:; " +
          "frame-src 'none'; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'; " +
          "frame-ancestors 'none'; " +
          "upgrade-insecure-requests"
        );

        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');

        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // XSS Protection (legacy browsers)
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=()');

        next();
      });
    }
  };
}


/**
 * Serves the Vercel Functions in `api/` from the dev server, so `npm run dev`
 * behaves like production: the browser calls /api/*, and the Gemini key is read
 * from .env.local on the server side only. Not used in production builds.
 */
function devApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      for (const key of [
        'GEMINI_API_KEY',
        'GEMINI_CHAT_MODEL',
        'GEMINI_TTS_MODEL',
        'GEMINI_CHAT_FALLBACK_MODELS',
        'GEMINI_TTS_FALLBACK_MODELS',
      ]) {
        if (env[key] !== undefined && process.env[key] === undefined) process.env[key] = env[key];
      }

      const handle = async (req: IncomingMessage, res: ServerResponse, name: string) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers.set(k, v);
        }
        const request = new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers,
          body: req.method === 'GET' || req.method === 'HEAD' || !chunks.length ? undefined : Buffer.concat(chunks),
        });
        const mod = await server.ssrLoadModule(`/api/${name}.ts`);
        const response: Response = await mod.POST(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      };

      server.middlewares.use((req, res, next) => {
        const match = /^\/api\/(chat|tts)(?:\?.*)?$/.exec(req.url ?? '');
        if (!match) return next();
        handle(req, res, match[1]).catch(next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        // Loopback only by default; use `npm run dev -- --host` to expose it.
        host: 'localhost',
      },
      plugins: [
        react(),
        tailwindcss(),
        securityHeadersPlugin(), // v1.11.0: Security headers
        devApiPlugin(env),
        // Bundle report on demand only (`npm run analyze`); never into dist/,
        // which would publish it, and never opening a browser in CI.
        process.env.ANALYZE
          ? visualizer({ filename: './reports/bundle-stats.html', gzipSize: true, brotliSize: true })
          : null,
      ],
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, '.'),
        }
      },
      build: {
        // Vite 8 bundles with Rolldown: the object form of `manualChunks` was
        // removed, so vendor splitting is expressed as `codeSplitting.groups`.
        rolldownOptions: {
          output: {
            codeSplitting: {
              groups: [
                // React ecosystem (usually 130-150 KB)
                {
                  name: 'react-vendor',
                  test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                },
              ],
            },
          },
        },
        // Set warning limit to 300 KB (stricter than 500 KB)
        chunkSizeWarningLimit: 300,
      }
    };
});
