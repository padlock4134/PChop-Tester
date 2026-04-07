import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // Auto-launch in the browser when starting the server
    strictPort: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
        // Optional: Add logging to see what's being proxied
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${options.target}${req.url}`);
          });
        }
      }
    }
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('mammoth') || id.includes('pdf-parse')) {
            return 'document-vendor';
          }

          return 'vendor';
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}));
