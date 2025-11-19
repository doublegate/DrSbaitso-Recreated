import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
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

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        securityHeadersPlugin(), // v1.11.0: Security headers
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // React ecosystem (usually 130-150 KB)
              'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

              // Firebase (already uses dynamic imports, but we'll split the core)
              // Note: Most firebase modules are already lazy-loaded in cloudSync.ts

              // Gemini AI SDK
              'gemini-vendor': ['@google/genai'],
            },
          },
        },
        // Set warning limit to 300 KB (stricter than 500 KB)
        chunkSizeWarningLimit: 300,
      }
    };
});
