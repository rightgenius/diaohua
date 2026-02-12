const { contextBridge, ipcRenderer } = require('electron');

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 日志
  log: (level, message) => ipcRenderer.invoke('log', level, message),

  // 截图
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  captureWebpage: (url, options) => ipcRenderer.invoke('capture-webpage', url, options),

  // 文件对话框
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // 文件操作
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  readFileBase64: (filePath) => ipcRenderer.invoke('read-file-base64', filePath),

  // 对象存储服务（S3 兼容）
  storageUploadToken: (config, key) => ipcRenderer.invoke('qiniu-upload-token', config, key),
  storageUpload: (config, base64Data, key, mimeType) => ipcRenderer.invoke('qiniu-upload', config, base64Data, key, mimeType),
  storageTestConnection: (config) => ipcRenderer.invoke('qiniu-test-connection', config),
  
  // 本地配置文件
  loadLocalConfig: () => ipcRenderer.invoke('load-local-config'),
  saveLocalConfig: (config) => ipcRenderer.invoke('save-local-config', config),

  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
});

// 保持与 Tauri API 类似的接口，便于迁移
contextBridge.exposeInMainWorld('__TAURI__', {
  invoke: async (command, args = {}) => {
    // 映射 Tauri 命令到 Electron API
    const commandMap = {
      // 截图相关
      'capture_screen': () => window.electronAPI.captureScreen(),
      'capture_webview_screenshot': () => {
        console.warn('[兼容性] capture_webview_screenshot 未实现，请使用 capture_webpage');
        return Promise.resolve({ success: false, error: '请使用 captureWebpage API' });
      },

      // 文件操作
      'save_file': () => {
        console.warn('[兼容性] save_file 未实现，请使用 saveFile');
        return Promise.resolve();
      },
      'read_file': () => {
        console.warn('[兼容性] read_file 未实现，请使用 readFile');
        return Promise.resolve();
      },

      // 对象存储（S3 兼容）
      'qiniu_upload_base64': ({ config, base64Data, key, mimeType }) => 
        window.electronAPI.storageUpload(config, base64Data, key, mimeType),
      'qiniu_upload_token': ({ config, key }) => 
        window.electronAPI.storageUploadToken(config, key),
      'qiniu_test_connection': ({ config }) => 
        window.electronAPI.storageTestConnection(config),
      'get_qiniu_config': () => {
        console.warn('[兼容性] get_qiniu_config 未实现');
        return Promise.resolve({ accessKey: '', secretKey: '', bucket: '' });
      },

      // 日志
      'frontend_log': ({ level, message }) => 
        window.electronAPI.log(level, message),
    };

    const handler = commandMap[command];
    if (handler) {
      try {
        return await handler(args);
      } catch (error) {
        console.error(`[TAURI兼容层] 命令 ${command} 失败:`, error);
        throw error;
      }
    } else {
      console.warn(`[TAURI兼容层] 未知命令: ${command}`);
      throw new Error(`未知命令: ${command}`);
    }
  },
});

console.log('[Preload] 预加载脚本已执行');
