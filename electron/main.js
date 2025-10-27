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

    // Use node.exe from resources in production, not electron.exe
    let nodePath;
    if (app.isPackaged) {
      // In production: use node.exe that should be bundled or use electron as fallback
      // But spawn backend as a separate process
      nodePath = process.execPath; // This will be electron.exe, we need to handle this differently
    } else {
      nodePath = process.execPath; // In dev this is node
    }

    console.log('Starting backend server...');
    console.log('Backend path:', backendPath);
    console.log('Is packaged:', app.isPackaged);
    console.log('Node/Electron path:', nodePath);

    if (!fs.existsSync(backendPath)) {
      console.error('Backend server file not found at:', backendPath);
      reject(new Error('Backend server file not found'));
      return;
    }

    // In packaged app, we need to spawn with electron but set a flag to prevent infinite loop
    const spawnOptions = {
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1' // This makes electron behave like node
      },
      stdio: 'pipe'
    };

    backendProcess = spawn(nodePath, [backendPath], spawnOptions);

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log(`[Backend stdout] ${output}`);
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      console.error(`[Backend stderr] ${output}`);
    });

    backendProcess.on('error', (error) => {
      console.error('[Backend] Failed to start backend server:', error);
      console.error('[Backend] Node path:', nodePath);
      console.error('[Backend] Backend path:', backendPath);
      console.error('[Backend] Spawn options:', JSON.stringify(spawnOptions, null, 2));
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`[Backend] Process exited with code ${code}`);
      if (code !== 0 && code !== null) {
        console.error(`[Backend] Process crashed with non-zero exit code: ${code}`);
      }
      backendProcess = null;
    });

    // Wait a bit for the server to start
    setTimeout(() => {
      console.log('Backend server should be running on http://localhost:3001');
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
