module.exports = {
  apps: [
    {
      // ===========================
      // AUDIOKONVERTER - VUE 3
      // ===========================
      name: 'audiokonverter-server',
      // Eigenes Backend statt der geteilten Datei in _backend_common,
      // siehe backend/README.md
      script: '/var/www/kodinitools.com/audiokonverter-backend/server.js',

      // 🎯 KORREKT: Working Directory
      cwd: '/var/www/kodinitools.com/audiokonverter-backend',

      // 🌐 Environment
      // UPLOAD_DIR/OUTPUT_DIR/MAX_FILE_SIZE standen hier, wurden vom Backend
      // aber nie gelesen — ersetzt durch die Variablen, die es wirklich kennt.
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
        FILES_DIR: '/var/www/kodinitools.com/audiokonverter/files',
        // Konvertierte Ergebnisse werden nach dieser Zeit automatisch gelöscht,
        // damit sie sich nicht endlos ansammeln. 6 h ist großzügig: Der Download
        // erfolgt sofort per Blob, ein offener Tab hat reichlich Puffer.
        // 0 schaltet das Aufräumen ab.
        CONVERT_TTL_MS: 21600000,
        MAX_UPLOAD_BYTES: 314572800,
      },

      // ⚙️ PM2 Einstellungen
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',

      // 📊 Logging
      error_file: '/root/.pm2/logs/audiokonverter-server-error.log',
      out_file: '/root/.pm2/logs/audiokonverter-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 🔄 Restart-Strategie
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // 🩺 Health Monitoring
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,

      // 🏷️ Metadata
      version: '2.0.0', // Vue 3 Version!
      namespace: 'kodinitools',
    },
  ],
}
