import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

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
      sandbox: true
    },
    icon: path.join(__dirname, '..', 'icon-512.png'),
    title: 'Audio Konverter'
  });

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
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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
