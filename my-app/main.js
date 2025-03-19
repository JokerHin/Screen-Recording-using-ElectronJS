const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  dialog,
} = require("electron");
const os = require("os");
const path = require("path");
const fs = require("fs");

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "assets", "icons", "icon.png"), // Set the window icon
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.js"), // Ensure correct path
      contextIsolation: true, // Keep it true for security
      enableRemoteModule: false, // Disable remote module
      nodeIntegration: false, // Prevent direct use of `require()`
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html")); // Corrected path
});

// Get available screen sources
ipcMain.handle("getSources", async () => {
  return await desktopCapturer.getSources({ types: ["window", "screen"] });
});

// Get operating system
ipcMain.handle("getOperatingSystem", () => {
  return os.platform();
});

// Show save dialog
ipcMain.handle("showSaveDialog", async () => {
  return await dialog.showSaveDialog({
    buttonLabel: "Save Recording",
    defaultPath: `recording-${Date.now()}.webm`,
    filters: [{ name: "Videos", extensions: ["webm"] }],
  });
});

// Save video
ipcMain.handle("saveVideo", (event, filePath, videoBuffer) => {
  const buffer = Buffer.from(videoBuffer); // Convert ArrayBuffer to Buffer
  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error("❌ Error saving video:", err);
    } else {
      console.log("✅ Video saved successfully!");
    }
  });
});
