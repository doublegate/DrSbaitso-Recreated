import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
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
