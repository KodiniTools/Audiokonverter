module.exports = {
  apps: [
    {
      // ===========================
      // AUDIOKONVERTER - VUE 3
      // ===========================
      name: 'audiokonverter-server',
      script: '/var/www/kodinitools.com/_backend_common/server.js',
      
      // 🎯 KORREKT: Working Directory
      cwd: '/var/www/kodinitools.com/audiokonverter',
      
      // 🌐 Environment
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
        UPLOAD_DIR: './uploads',
        FILES_DIR: './files',
        MAX_FILE_SIZE: '500MB'
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
      namespace: 'kodinitools'
    }
  ]
};
