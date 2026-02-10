import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    host: '172.20.10.3', // Permet l'accès depuis toutes les interfaces
    open: false, // Désactive l'ouverture automatique
    cors: true, // Active CORS
    proxy: mode === 'development' ? {
      '/api': {
<<<<<<< HEAD
        target: 'http://172.20.10.3:5000',
=======
        target: process.env.VITE_API_URL || 'http://localhost:5000',
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
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
<<<<<<< HEAD
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom']
        }
      }
    }
=======
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
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
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
<<<<<<< HEAD
    __APP_VERSION__: JSON.stringify('1.0.0'),
=======
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
  }
}))