import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initIpc } from './ipc';

import reload from 'electron-reload';

let mainWindow;

if (!process.env.NODE_ENV !== 'production') {
  reload(`${__dirname}/../../`, {
    electron: path.join(`${__dirname}/../../`, 'node_modules', '.bin', 'electron'),
    awaitWriteFinish: true,
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
    width: 800,
    height: 600,
    title: app.name,
    show: false,
  });

  win.on('ready-to-show', () => {
    win.show();

    if (process.env.NODE_ENV !== 'production') {
      win.webContents.openDevTools();
    }
  });

  await win.loadFile(path.join(__dirname, '../../public', 'index.html'));
  return win;
}

(async () => {
  app.allowRendererProcessReuse = false;
  await app.whenReady();

  initIpc();

  mainWindow = await createWindow();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;

    // Exit if window is closes, even though this is not macOS default behaviour
    app.quit();
  });
})();
