const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  selectSource: () => ipcRenderer.send("select-source"),
  onSourceSelected: (callback) =>
    ipcRenderer.on("source-selected", (_, sources) => callback(sources)),
  startRecording: () => ipcRenderer.send("start-recording"),
  stopRecording: () => ipcRenderer.send("stop-recording"),
  saveVideo: (videoBuffer) => ipcRenderer.send("save-video", videoBuffer),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args), // Expose invoke for async IPC
  on: (channel, callback) => ipcRenderer.on(channel, callback), // Expose on for event listeners
});
