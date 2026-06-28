const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process here if needed
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: platform: process.platform
});