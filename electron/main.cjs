const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('path');
const https = require('https');

const APP_VERSION = '1.0.0';
const UPDATE_CHECK_URL = 'https://functions.poehali.dev/cd1faf9e-5de7-4980-9f8c-876dc02534c0?action=check-update&version=' + APP_VERSION;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../dist/logo.svg'),
    show: false,
  });

  Menu.setApplicationMenu(null);

  const indexPath = path.join(__dirname, '../dist/index.html');
  win.loadFile(indexPath);

  win.once('ready-to-show', () => {
    win.show();
    checkForUpdates(win);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function checkForUpdates(win) {
  https.get(UPDATE_CHECK_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.has_update) {
          dialog.showMessageBox(win, {
            type: 'info',
            title: 'Доступно обновление',
            message: `Вышла новая версия ${json.current_version}`,
            detail: 'Нажмите "Скачать" чтобы получить обновление.',
            buttons: ['Скачать', 'Позже'],
            defaultId: 0,
          }).then(({ response }) => {
            if (response === 0 && json.download_url) {
              shell.openExternal(json.download_url);
            }
          });
        }
      } catch (_) {}
    });
  }).on('error', () => {});
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
