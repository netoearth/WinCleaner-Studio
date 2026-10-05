const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
let tray = null;

// Determine if in dev or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = process.env.PORT || 3000;

function startBackendServer() {
  if (isDev) {
    // In dev, the server is usually already running via `npm run dev`
    return;
  }

  // In production package, run the server process
  try {
    const serverScript = path.join(__dirname, '../server.js');
    serverProcess = spawn(process.execPath, [serverScript], {
      env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT) },
      stdio: 'ignore',
      windowsHide: true,
    });

    serverProcess.on('error', (err) => {
      console.error('[Electron] Failed to start backend server:', err);
    });
  } catch (err) {
    console.error('[Electron] Server start exception:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617', // slate-950
    title: 'WinCleaner Studio - Win32 深度系统优化工具箱',
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
  });

  // Graceful show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // External link handler
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load backend URL or wait 500ms
  const targetUrl = `http://localhost:${PORT}`;
  const loadPage = () => {
    mainWindow.loadURL(targetUrl).catch(() => {
      setTimeout(loadPage, 600);
    });
  };

  loadPage();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
