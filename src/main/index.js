import {app, BrowserWindow} from 'electron';

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600})

  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null

    // Exit if window is closes, even though this is not macOS default behaviour
    app.quit();
  })
}

app.on('ready', () => {
  createWindow();
});