const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = process.env.PORT || 3000;

function startBackendServer() {
  if (isDev) {
    // In development mode, server is already running on localhost:3000
    return;
  }

  try {
    // In production build, load the bundled Express backend directly inside Electron main process
    const bundledServerPath = path.join(__dirname, '../dist/server.cjs');
    if (fs.existsSync(bundledServerPath)) {
      require(bundledServerPath);
      console.log('[Electron] In-process production Express server started on port', PORT);
    } else {
      console.warn('[Electron] bundled server not found at', bundledServerPath);
    }
  } catch (err) {
    console.error('[Electron] Error starting production backend:', err);
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const targetUrl = `http://localhost:${PORT}`;
  const loadPage = () => {
    mainWindow.loadURL(targetUrl).catch(() => {
      setTimeout(loadPage, 500);
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
