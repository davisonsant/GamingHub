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

  // In production, load the built index.html
  // In development, you could load the vite dev server URL
  const isDev = !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://127.0.0.1:3000');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

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
