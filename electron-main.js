import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "GamingHub - Biblioteca de Jogos",
    icon: path.join(__dirname, 'public/icon.ico') // Icon for the app window
  });

  const url = 'http://127.0.0.1:3000';
  let attempts = 0;
  const maxAttempts = 20;
  const delay = 250;

  function loadWithRetry() {
    if (win.isDestroyed()) return;
    win.loadURL(url)
      .then(() => {
        console.log(`[Electron] Successfully loaded ${url}`);
      })
      .catch((err) => {
        attempts++;
        console.warn(`[Electron] Failed to load ${url} (Attempt ${attempts}/${maxAttempts}): ${err.message}`);
        if (attempts < maxAttempts) {
          setTimeout(() => {
            if (!win.isDestroyed()) {
              loadWithRetry();
            }
          }, delay);
        } else {
          console.error(`[Electron] Failed to load ${url} after ${maxAttempts} attempts.`);
        }
      });
  }

  loadWithRetry();
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const win = windows[0];
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    // Start the bundled backend Express server if the app is packaged
    if (app.isPackaged) {
      process.env.NODE_ENV = 'production';
      process.env.IS_ELECTRON = 'true';
      try {
        const serverPath = path.join(__dirname, 'dist/server.cjs');
        require(serverPath);
        console.log('Production Express server successfully started from Electron process.');
      } catch (err) {
        console.error('Failed to start automatic Express server in Electron:', err);
      }
    }

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
}
