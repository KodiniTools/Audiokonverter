import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';
import http from 'http';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;
let frontendServer;

// Single instance lock to prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Start backend server
function startBackendServer() {
  return new Promise((resolve, reject) => {
    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'electron-backend', 'server.js')
      : path.join(__dirname, '..', 'electron-backend', 'server.js');

    // Create log file for debugging
    const logPath = path.join(app.getPath('userData'), 'backend.log');
    const logStream = fs.createWriteStream(logPath, { flags: 'w' });

    const log = (message) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      console.log(message);
      logStream.write(logMessage);
    };

    log('=== BACKEND START DEBUG ===');
    log('Backend path: ' + backendPath);
    log('Is packaged: ' + app.isPackaged);
    log('process.execPath: ' + process.execPath);
    log('process.argv[0]: ' + process.argv[0]);
    log('User data path: ' + app.getPath('userData'));
    log('Resources path: ' + process.resourcesPath);

    if (!fs.existsSync(backendPath)) {
      log('ERROR: Backend server file not found at: ' + backendPath);
      reject(new Error('Backend server file not found'));
      return;
    }

    log('Backend file exists: OK');

    // Check if we can find node_modules
    const nodeModulesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'node_modules')
      : path.join(__dirname, '..', 'node_modules');

    const backendNodeModulesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'electron-backend', 'node_modules')
      : path.join(__dirname, '..', 'electron-backend', 'node_modules');

    log('Node modules path: ' + nodeModulesPath);
    log('Node modules exists: ' + fs.existsSync(nodeModulesPath));
    log('Backend node_modules path: ' + backendNodeModulesPath);
    log('Backend node_modules exists: ' + fs.existsSync(backendNodeModulesPath));

    // In packaged app, we need to spawn with electron but set a flag to prevent infinite loop
    const spawnOptions = {
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1', // This makes electron behave like node
        NODE_PATH: backendNodeModulesPath // Point to backend's node_modules
      },
      stdio: 'pipe',
      cwd: app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'electron-backend')
        : path.join(__dirname, '..', 'electron-backend')
    };

    log('Spawn options: ' + JSON.stringify(spawnOptions, null, 2));
    log('Spawning backend process...');

    try {
      backendProcess = spawn(process.execPath, [backendPath], spawnOptions);
      log('Backend process spawned with PID: ' + backendProcess.pid);
    } catch (err) {
      log('ERROR spawning backend: ' + err.message);
      reject(err);
      return;
    }

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      const message = `[Backend stdout] ${output}`;
      console.log(message);
      logStream.write(message + '\n');
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      const message = `[Backend stderr] ${output}`;
      console.error(message);
      logStream.write(message + '\n');
    });

    backendProcess.on('error', (error) => {
      log('[Backend] ERROR: Failed to start backend server: ' + error.message);
      log('[Backend] Error stack: ' + error.stack);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      log(`[Backend] Process exited with code ${code}`);
      if (code !== 0 && code !== null) {
        log(`[Backend] ERROR: Process crashed with non-zero exit code: ${code}`);
      }
      backendProcess = null;
      logStream.end();
    });

    // Wait a bit for the server to start
    setTimeout(() => {
      log('Backend server should be running on http://localhost:3001');
      log('Log file location: ' + logPath);
      resolve();
    }, 2000);
  });
}

// Stop backend server
function stopBackendServer() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// Start frontend HTTP server with proxy
function startFrontendServer() {
  return new Promise((resolve, reject) => {
    const distPath = path.join(__dirname, '..', 'dist');

    frontendServer = http.createServer(async (req, res) => {
      const decodedUrl = decodeURIComponent(req.url);
      console.log('Frontend server request:', req.method, decodedUrl);

      // Proxy requests to /audiokonverter/* to backend
      if (decodedUrl.startsWith('/audiokonverter/')) {
        const backendUrl = `http://localhost:3001${decodedUrl}`;
        console.log('Proxying to backend:', backendUrl);

        const proxyReq = http.request(backendUrl, {
          method: req.method,
          headers: req.headers
        }, (proxyRes) => {
          console.log('Backend response:', proxyRes.statusCode, decodedUrl);
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
          console.error('Proxy error:', error);
          res.writeHead(500);
          res.end('Proxy error');
        });

        req.pipe(proxyReq);
        return;
      }

      // Serve static files from dist/
      let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        filePath = path.join(distPath, 'index.html'); // Fallback to index.html
      }

      // Get content type
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      createReadStream(filePath).pipe(res);
    });

    frontendServer.listen(3002, () => {
      console.log('Frontend server running on http://localhost:3002');
      resolve();
    });

    frontendServer.on('error', (error) => {
      console.error('Frontend server error:', error);
      reject(error);
    });
  });
}

// Stop frontend server
function stopFrontendServer() {
  if (frontendServer) {
    console.log('Stopping frontend server...');
    frontendServer.close();
    frontendServer = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '..', 'icon-512.png'),
    title: 'Audio Konverter'
  });

  // Load app from local HTTP server (with proxy)
  mainWindow.loadURL('http://localhost:3002');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    // Start backend server first
    await startBackendServer();
    console.log('Backend server started successfully');

    // Start frontend server with proxy
    await startFrontendServer();
    console.log('Frontend server started successfully');
  } catch (error) {
    console.error('Failed to start servers:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopFrontendServer();
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopFrontendServer();
  stopBackendServer();
});

// IPC Handlers for file operations
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }
  return null;
});

ipcMain.handle('save-file', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath,
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath);
    return {
      success: true,
      data: data,
      name: path.basename(filePath)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    await fs.promises.writeFile(filePath, data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('get-app-path', async () => {
  return app.getPath('userData');
});

ipcMain.handle('get-backend-log', async () => {
  const logPath = path.join(app.getPath('userData'), 'backend.log');
  try {
    const logContent = await fs.promises.readFile(logPath, 'utf-8');
    return { success: true, content: logContent, path: logPath };
  } catch (error) {
    return { success: false, error: error.message, path: logPath };
  }
});

ipcMain.handle('open-log-folder', async () => {
  const { shell } = await import('electron');
  shell.openPath(app.getPath('userData'));
});
