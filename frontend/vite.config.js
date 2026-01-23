import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Permet l'accès depuis toutes les interfaces
    open: false, // Désactive l'ouverture automatique
    cors: true, // Active CORS
    proxy: mode === 'development' ? {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // Configuration supplémentaire pour le proxy
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err.message);
          });
        }
      }
    } : undefined // Pas de proxy en production
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
          utils: ['axios', 'date-fns', 'lodash'],
          charts: ['chart.js', 'recharts'],
          pdf: ['jspdf', 'html2canvas']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  }
}))