import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { createReadStream, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { FFMPEG_CORE_DIR, FFMPEG_CORE_FILES } from './src/config/ffmpegCore'

/**
 * Liefert den FFmpeg-Kern (@ffmpeg/core, ESM) selbst aus, statt ihn zur
 * Laufzeit von unpkg.com zu laden: beim Build als Asset nach
 * dist/<FFMPEG_CORE_DIR>/, im Dev-Server direkt aus node_modules.
 */
function ffmpegCore(): Plugin {
  // ESM-Build: der Worker von @ffmpeg/ffmpeg läuft als Modul-Worker, dort
  // scheitert importScripts() und der Kern wird per import() geladen – das
  // braucht einen Default-Export, den nur der ESM-Build hat.
  const coreDir = join(dirname(createRequire(import.meta.url).resolve('@ffmpeg/core')), '..', 'esm')
  const mimeTypes: Record<string, string> = {
    '.js': 'text/javascript',
    '.wasm': 'application/wasm',
  }

  return {
    name: 'ffmpeg-core',
    configureServer(server) {
      const prefix = `${server.config.base}${FFMPEG_CORE_DIR}/`
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        if (!path.startsWith(prefix)) return next()
        const name = path.slice(prefix.length)
        if (!(FFMPEG_CORE_FILES as readonly string[]).includes(name)) return next()
        res.setHeader('Content-Type', mimeTypes[name.slice(name.lastIndexOf('.'))])
        createReadStream(join(coreDir, name)).pipe(res)
      })
    },
    generateBundle() {
      for (const name of FFMPEG_CORE_FILES) {
        this.emitFile({
          type: 'asset',
          fileName: `${FFMPEG_CORE_DIR}/${name}`,
          source: readFileSync(join(coreDir, name)),
        })
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
      ffmpegCore(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Der FFmpeg-Kern (~32 MB) wird nicht vorab gecacht, sondern erst bei
          // Bedarf über die Laufzeitregel unten.
          globIgnores: ['**/ffmpeg/**'],
          runtimeCaching: [
            {
              urlPattern: /\/ffmpeg\/[^/]+\/ffmpeg-core\.(?:js|wasm)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'ffmpeg-wasm-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        manifest: {
          name: 'Audio Konverter - Schnell & Einfach',
          short_name: 'Audio Konverter',
          description:
            'Konvertiere Audiodateien schnell und einfach. MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, AIFF, WMA. Kostenlos, sicher und direkt im Browser.',
          theme_color: '#f6f5f1',
          background_color: '#f6f5f1',
          display: 'standalone',
          scope: isProduction ? '/audiokonverter/' : '/',
          start_url: isProduction ? '/audiokonverter/' : '/',
          categories: ['utilities', 'music'],
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    // Base Path - /audiokonverter/ für Production, / für Development
    base: isProduction ? '/audiokonverter/' : '/',

    // Development Server
    server: {
      port: 5173,
      strictPort: false,
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/files': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
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
            utils: ['axios'],
            ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
          },

          // Asset-Dateinamen mit Hashes
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? ''
            const info = name.split('.')
            let extType = info[info.length - 1]

            // Kategorisiere Assets
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(name)) {
              extType = 'img'
            } else if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) {
              extType = 'fonts'
            }

            return `assets/${extType}/[name]-[hash][extname]`
          },

          // Chunk- und Entry-Dateinamen
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },

      // Asset Inline Limit (4KB)
      assetsInlineLimit: 4096,

      // Compression Report
      reportCompressedSize: true,
    },

    // Preview Server (für lokale Production-Tests)
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/files': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },

    // Dependency Optimierungen
    optimizeDeps: {
      include: ['vue', 'pinia', 'vue-i18n', 'axios'],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  }
})
