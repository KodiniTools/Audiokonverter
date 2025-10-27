import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;

// Start backend server
function startBackendServer() {
  return new Promise((resolve, reject) => {
    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js')
      : path.join(__dirname, '..', 'backend', 'server.js');

    const nodePath = process.execPath;

    console.log('Starting backend server...');
    console.log('Backend path:', backendPath);
    console.log('Node path:', nodePath);

    if (!fs.existsSync(backendPath)) {
      console.error('Backend server file not found at:', backendPath);
      reject(new Error('Backend server file not found'));
      return;
    }

    backendProcess = spawn(nodePath, [backendPath], {
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: 'production'
      },
      stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data.toString().trim()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend server:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Allow localhost requests
      webSecurity: false // Allow CORS for localhost
    },
    icon: path.join(__dirname, '..', 'icon-512.png'),
    title: 'Audio Konverter'
  });

  // Allow localhost requests in session
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['http://localhost:*/*', 'http://127.0.0.1:*/*'] },
    (details, callback) => {
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    { urls: ['http://localhost:*/*', 'http://127.0.0.1:*/*'] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*']
        }
      });
    }
  );

  // Load the built app
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    console.error('Index file not found at:', indexPath);
    console.error('Please run "npm run build" first to create the distribution files.');
  }

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
  } catch (error) {
    console.error('Failed to start backend server:', error);
    // Continue anyway - user might have backend running separately
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
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
