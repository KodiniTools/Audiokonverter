import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [vue()],
    
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    // Base Path - /audiokonverter/ für Production, / für Development
    base: isProduction ? '/audiokonverter/' : '/',

    // Development Server
    server: {
      port: 5173,
      strictPort: false,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        '/files': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },

    // Production Build
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      
      // Minify mit esbuild (schneller als terser)
      minify: 'esbuild',
      
      // Target für moderne Browser
      target: 'es2015',
      
      // CSS Code-Splitting
      cssCodeSplit: true,
      
      // Chunk-Größen-Warnung
      chunkSizeWarningLimit: 1000,
      
      // Rollup-Optionen
      rollupOptions: {
        output: {
          // Manuelle Chunk-Aufteilung für besseres Caching
          manualChunks: {
            'vue-vendor': ['vue', 'pinia'],
            'i18n-vendor': ['vue-i18n'],
            'utils': ['axios']
          },
          
          // Asset-Dateinamen mit Hashes
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            let extType = info[info.length - 1]
            
            // Kategorisiere Assets
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              extType = 'img'
            } else if (/\.(woff2?|ttf|otf|eot)$/i.test(assetInfo.name)) {
              extType = 'fonts'
            }
            
            return `assets/${extType}/[name]-[hash][extname]`
          },
          
          // Chunk- und Entry-Dateinamen
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      
      // Asset Inline Limit (4KB)
      assetsInlineLimit: 4096,
      
      // Compression Report
      reportCompressedSize: true
    },

    // Preview Server (für lokale Production-Tests)
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/files': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },

    // Dependency Optimierungen
    optimizeDeps: {
      include: ['vue', 'pinia', 'vue-i18n', 'axios']
    }
  }
})
